using System.Linq;
using System.Text;
using System.Text.Json;

namespace ids.Services
{
    public class GeminiService
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;
        private readonly HttpClient _httpClient;
        private readonly string _knowledgeBaseContent;
        private readonly string _apiKey;
        private static bool _knowledgeBaseLoaded = false;
        private string? _cachedWorkingModel = null;

        public GeminiService(IConfiguration configuration, IWebHostEnvironment env, IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _env = env;
            _httpClient = httpClientFactory.CreateClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(60);
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "OnlineLearningPlatform/1.0");

            // Load API key
            _apiKey = _configuration["GEMINI_API_KEY"] ?? string.Empty;
            if (string.IsNullOrEmpty(_apiKey))
            {
                Console.WriteLine("[GeminiService] ⚠️ WARNING: GEMINI_API_KEY is missing from configuration!");
                ErrorLogger.Log(new Exception("Gemini API key is missing from configuration"), _env);
            }
            else
            {
                Console.WriteLine("[GeminiService] ✅ Gemini API key loaded successfully");
            }

            // Load knowledge base ONCE when service is created (server startup)
            _knowledgeBaseContent = LoadKnowledgeBaseSync();
            Console.WriteLine($"[GeminiService] ✅ Knowledge base loaded: {_knowledgeBaseContent.Length} characters");
            _knowledgeBaseLoaded = true;
        }

        private string GetKnowledgeBasePath()
        {
            var knowledgePath = Path.Combine(_env.ContentRootPath, "knowledge", "online-learning-platform.md");
            return knowledgePath;
        }

        private string LoadKnowledgeBaseSync()
        {
            try
            {
                var knowledgePath = GetKnowledgeBasePath();
                Console.WriteLine($"[GeminiService] 📖 Loading knowledge base from: {knowledgePath}");

                if (File.Exists(knowledgePath))
                {
                    var content = File.ReadAllText(knowledgePath);
                    Console.WriteLine($"[GeminiService] ✅ Knowledge base file found and loaded successfully");
                    return content;
                }
                else
                {
                    var errorMsg = $"Knowledge base file not found at: {knowledgePath}";
                    Console.WriteLine($"[GeminiService] ❌ ERROR: {errorMsg}");
                    ErrorLogger.Log(new FileNotFoundException(errorMsg), _env);
                    return "# Online Learning Platform Knowledge Base\n\nKnowledge base file not found. Please ensure the knowledge file exists.";
                }
            }
            catch (Exception ex)
            {
                var errorMsg = $"Error loading knowledge base: {ex.Message}";
                Console.WriteLine($"[GeminiService] ❌ ERROR: {errorMsg}");
                ErrorLogger.Log(ex, _env);
                return $"# Online Learning Platform Knowledge Base\n\nError loading knowledge base: {ex.Message}";
            }
        }

        private async Task<List<string>> GetAvailableModelsAsync()
        {
            try
            {
                Console.WriteLine("[GeminiService] 🔍 Fetching available models from Gemini API...");
                
                var url = $"https://generativelanguage.googleapis.com/v1beta/models?key={_apiKey}";
                var response = await _httpClient.GetAsync(url);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[GeminiService] ❌ Failed to fetch models: {response.StatusCode}");
                    return new List<string>();
                }

                var jsonDoc = JsonDocument.Parse(responseContent);
                var availableModels = new List<string>();

                if (jsonDoc.RootElement.TryGetProperty("models", out var modelsArray))
                {
                    foreach (var model in modelsArray.EnumerateArray())
                    {
                        if (model.TryGetProperty("name", out var nameElement) &&
                            model.TryGetProperty("supportedGenerationMethods", out var methodsElement))
                        {
                            var modelName = nameElement.GetString();
                            var supportsGenerateContent = false;

                            foreach (var method in methodsElement.EnumerateArray())
                            {
                                if (method.GetString() == "generateContent")
                                {
                                    supportsGenerateContent = true;
                                    break;
                                }
                            }

                            if (supportsGenerateContent && !string.IsNullOrEmpty(modelName))
                            {
                                // Extract model name without "models/" prefix
                                var cleanModelName = modelName.Replace("models/", "");
                                availableModels.Add(cleanModelName);
                                Console.WriteLine($"[GeminiService] ✅ Found model: {cleanModelName}");
                            }
                        }
                    }
                }

                Console.WriteLine($"[GeminiService] 📊 Total available models with generateContent: {availableModels.Count}");
                return availableModels;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GeminiService] ❌ Error fetching models: {ex.Message}");
                ErrorLogger.Log(ex, _env);
                return new List<string>();
            }
        }

        /// <summary>
        /// Sends a pre-built prompt to Gemini and returns the generated text.
        /// Used by RAG flows where the caller (e.g. AiController) supplies the full factual prompt.
        /// Gemini acts only as a formatter; it must not invent facts.
        /// </summary>
        public async Task<string> GenerateFromPromptAsync(string prompt)
        {
            if (string.IsNullOrEmpty(_apiKey))
            {
                Console.WriteLine("[GeminiService] ❌ ERROR: API key is missing");
                return "I apologize, but the AI service is not properly configured. Please contact the administrator.";
            }

            if (string.IsNullOrWhiteSpace(prompt))
            {
                return "I need a question or some context to respond. Please try again.";
            }

            if (!string.IsNullOrEmpty(_cachedWorkingModel))
            {
                var cachedResponse = await TryGenerateAsync(_cachedWorkingModel, prompt);
                if (cachedResponse != null)
                    return ExtractResponseText(cachedResponse);
                _cachedWorkingModel = null;
            }

            var availableModels = await GetAvailableModelsAsync();
            if (availableModels.Count == 0)
            {
                return "I apologize, but I couldn't connect to the AI service. Please try again later.";
            }

            string? responseContent = null;
            foreach (var model in availableModels)
            {
                responseContent = await TryGenerateAsync(model, prompt);
                if (responseContent != null)
                {
                    _cachedWorkingModel = model;
                    break;
                }
            }

            if (responseContent == null)
                return "I apologize, but I encountered an error while processing your request. Please try again later.";

            return ExtractResponseText(responseContent);
        }

        private async Task<string?> TryGenerateAsync(string modelName, string prompt)
        {
            try
            {
                Console.WriteLine($"[GeminiService] 🔄 Trying model: {modelName}");

                var requestBody = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = prompt }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        temperature = 0.7,
                        topK = 40,
                        topP = 0.95,
                        maxOutputTokens = 8192
                    }
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelName}:generateContent?key={_apiKey}";
                var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = content };

                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[GeminiService] ❌ Model {modelName} failed with status {response.StatusCode}");
                    return null;
                }

                Console.WriteLine($"[GeminiService] ✅ Model worked: {modelName}");
                return responseContent;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GeminiService] ❌ Exception trying {modelName}: {ex.Message}");
                return null;
            }
        }

        private static readonly string[] GreetingTriggers = new[]
        {
            "hello", "hi", "hey", "howdy", "greetings", "good morning", "good afternoon", "good evening",
            "hi there", "hey there", "hello there", "good day", "what's up", "how are you", "hi again"
        };

        public async Task<string> GetResponseAsync(string userMessage)
        {
            Console.WriteLine($"[GeminiService] 📨 Received user message: {userMessage}");

            try
            {
                // Respond warmly to greetings (hello, hi, etc.) so we never say "Sorry, I can only help..."
                var trimmed = (userMessage ?? "").Trim();
                if (!string.IsNullOrEmpty(trimmed))
                {
                    var lower = trimmed.ToLowerInvariant();
                    var isGreeting = GreetingTriggers.Any(g => lower == g || lower.StartsWith(g + " ") || lower.EndsWith(" " + g));
                    if (isGreeting)
                    {
                        Console.WriteLine("[GeminiService] 👋 Greeting detected, responding with welcome");
                        return "Hello! Nice to meet you. I'm your AI assistant for the Online Learning Platform. I can help you with courses, enrollment, lessons, quizzes, certificates, or any questions about how the platform works. What would you like to know?";
                    }
                }

                // Validate API key
                if (string.IsNullOrEmpty(_apiKey))
                {
                    Console.WriteLine("[GeminiService] ❌ ERROR: API key is missing");
                    return "I apologize, but the AI service is not properly configured. Please contact the administrator.";
                }

                // Validate knowledge base is loaded
                if (string.IsNullOrEmpty(_knowledgeBaseContent))
                {
                    Console.WriteLine("[GeminiService] ❌ ERROR: Knowledge base is empty");
                    return "I apologize, but the knowledge base could not be loaded. Please contact the administrator.";
                }

                // Build an analysis-style prompt: analyze the user's request and the knowledge document, then answer
                var systemPrompt = $@"You are the AI assistant for the Online Learning Platform. Your role is to analyze what users ask and answer using the platform's reference document.

HOW YOU MUST WORK:
1. ANALYZE the user's message: identify their intent (e.g. how-to, troubleshooting, explanation, clarification).
2. ANALYZE the reference document below: find the sections that relate to what they need.
3. SYNTHESIZE an answer: use the document's content to give a clear, accurate, and helpful reply. Cite or follow the structure of the document where it helps.
4. If the user's request is not about this platform (e.g. general knowledge, other topics), reply: ""Sorry, I can only help with questions about this learning platform.""
5. For greetings (hello, hi, etc.) respond warmly, then offer to help with the platform.

REFERENCE DOCUMENT (analyze and use when answering):
---
{_knowledgeBaseContent}
---

USER REQUEST (analyze intent and answer using the reference document above):
---
{userMessage}
---

Provide a direct, helpful answer based on your analysis of the document and the user's request. Do not repeat the instructions; only output the answer.";

                Console.WriteLine($"[GeminiService] 🔄 Building request to Gemini API...");
                Console.WriteLine($"[GeminiService] 📝 Prompt length: {systemPrompt.Length} characters");

                // Use cached working model if available
                if (!string.IsNullOrEmpty(_cachedWorkingModel))
                {
                    Console.WriteLine($"[GeminiService] 💾 Using cached model: {_cachedWorkingModel}");
                    var cachedResponse = await TryGenerateAsync(_cachedWorkingModel, systemPrompt);
                    if (cachedResponse != null)
                    {
                        return ExtractResponseText(cachedResponse);
                    }
                    else
                    {
                        Console.WriteLine("[GeminiService] ⚠️ Cached model no longer works, discovering models again...");
                        _cachedWorkingModel = null;
                    }
                }

                // Discover available models
                var availableModels = await GetAvailableModelsAsync();
                if (availableModels.Count == 0)
                {
                    Console.WriteLine("[GeminiService] ❌ No available models found");
                    ErrorLogger.Log(new Exception("No available Gemini models found for this API key"), _env);
                    return "I apologize, but I couldn't connect to the AI service. Please try again later.";
                }

                // Try each model until one works
                string? responseContent = null;
                foreach (var model in availableModels)
                {
                    responseContent = await TryGenerateAsync(model, systemPrompt);
                    if (responseContent != null)
                    {
                        _cachedWorkingModel = model;
                        Console.WriteLine($"[GeminiService] 💾 Caching working model: {model}");
                        break;
                    }
                }

                if (responseContent == null)
                {
                    Console.WriteLine("[GeminiService] ❌ All models failed");
                    ErrorLogger.Log(new Exception("All available Gemini models failed to respond"), _env);
                    return "I apologize, but I encountered an error while processing your request. Please try again later.";
                }

                Console.WriteLine($"[GeminiService] ✅ API call successful");
                return ExtractResponseText(responseContent);
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"[GeminiService] ❌ HTTP Exception: {ex.Message}");
                ErrorLogger.Log(ex, _env);
                return "I apologize, but I encountered a network error. Please check your connection and try again.";
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"[GeminiService] ❌ JSON Parse Exception: {ex.Message}");
                ErrorLogger.Log(ex, _env);
                return "I apologize, but I encountered an error parsing the response. Please try again.";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GeminiService] ❌ Unexpected Exception: {ex.Message}");
                Console.WriteLine($"[GeminiService] 📚 Stack trace: {ex.StackTrace}");
                ErrorLogger.Log(ex, _env);
                return "I apologize, but I encountered an unexpected error. Please try again later.";
            }
        }

        private string ExtractResponseText(string responseContent)
        {
            try
            {
                Console.WriteLine($"[GeminiService] 📄 Response preview: {responseContent.Substring(0, Math.Min(300, responseContent.Length))}...");

                // Parse response
                var responseJson = JsonDocument.Parse(responseContent);

                // Extract the generated text
                if (responseJson.RootElement.TryGetProperty("candidates", out var candidates) &&
                    candidates.GetArrayLength() > 0)
                {
                    var firstCandidate = candidates[0];

                    // Check for finishReason
                    if (firstCandidate.TryGetProperty("finishReason", out var finishReason))
                    {
                        var reason = finishReason.GetString();
                        Console.WriteLine($"[GeminiService] 🏁 Finish reason: {reason}");
                        
                        if (reason == "SAFETY")
                        {
                            Console.WriteLine($"[GeminiService] ⚠️ WARNING: Response blocked by safety filter");
                            return "I apologize, but I cannot process that request due to safety restrictions.";
                        }
                    }

                    if (firstCandidate.TryGetProperty("content", out var contentElement) &&
                        contentElement.TryGetProperty("parts", out var parts) &&
                        parts.GetArrayLength() > 0)
                    {
                        var sb = new StringBuilder();
                        for (var i = 0; i < parts.GetArrayLength(); i++)
                        {
                            var part = parts[i];
                            if (part.TryGetProperty("text", out var textElement))
                            {
                                var t = textElement.GetString();
                                if (!string.IsNullOrEmpty(t))
                                    sb.Append(t);
                            }
                        }
                        var responseText = sb.ToString();
                        Console.WriteLine($"[GeminiService] ✅ Successfully extracted response ({parts.GetArrayLength()} part(s))");
                        Console.WriteLine($"[GeminiService] 💬 Response length: {responseText.Length} characters");
                        
                        if (string.IsNullOrEmpty(responseText))
                        {
                            Console.WriteLine($"[GeminiService] ⚠️ WARNING: Response text is empty");
                            return "I apologize, but I couldn't generate a response. Please try again.";
                        }

                        var reason = firstCandidate.TryGetProperty("finishReason", out var fr) ? fr.GetString() : null;
                        if (reason == "MAX_TOKENS")
                        {
                            responseText = responseText.TrimEnd();
                            if (!responseText.EndsWith(".") && !responseText.EndsWith("?") && !responseText.EndsWith("!"))
                                responseText += "...";
                            responseText += " [Answer was truncated due to length. You can ask a more specific question for a shorter reply.]";
                        }

                        return responseText;
                    }
                }

                // If we got here, the response structure was unexpected
                Console.WriteLine($"[GeminiService] ❌ ERROR: Unexpected response structure");
                Console.WriteLine($"[GeminiService] 📄 Full response: {responseContent}");
                ErrorLogger.Log(new Exception($"Unexpected Gemini response structure: {responseContent}"), _env);
                return "I apologize, but I couldn't generate a response. Please try again.";
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"[GeminiService] ❌ JSON Parse Exception in ExtractResponseText: {ex.Message}");
                ErrorLogger.Log(ex, _env);
                throw;
            }
        }
    }
}
