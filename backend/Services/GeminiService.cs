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


        public async Task<string> GetResponseAsync(string userMessage)
        {
            Console.WriteLine($"[GeminiService] 📨 Received user message: {userMessage}");

            try
            {
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

                // Build the strict system prompt
                var systemPrompt = $@"SYSTEM:

You are the official assistant of the Online Learning Platform.

You ONLY answer questions related to this platform using the knowledge below.

If the user asks anything outside this platform (countries, history, general knowledge, etc),
you must reply:

""Sorry, I can only help with questions related to this learning platform.""

KNOWLEDGE:
{_knowledgeBaseContent}

USER QUESTION:
{userMessage}";

                Console.WriteLine($"[GeminiService] 🔄 Building request to Gemini API...");
                Console.WriteLine($"[GeminiService] 📝 Prompt length: {systemPrompt.Length} characters");

                // Prepare the request to Gemini API
                var requestBody = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = systemPrompt }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        temperature = 0.7,
                        topK = 40,
                        topP = 0.95,
                        maxOutputTokens = 2048
                    }
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                // Try all available models in order until one works
                var modelsToTry = new[]
                {
                    ("gemini-2.0-flash", "v1"),
                    ("gemini-1.5-flash", "v1"),
                    ("gemini-2.0-flash-lite", "v1"),
                    ("gemini-1.5-pro", "v1"),
                };

                HttpResponseMessage? response = null;
                string? responseContent = null;
                string? workingModel = null;
                string? workingApiVersion = null;
                var startTime = DateTime.UtcNow;

                foreach (var (model, apiVersion) in modelsToTry)
                {
                    try
                    {
                        var url = $"https://generativelanguage.googleapis.com/{apiVersion}/models/{model}:generateContent?key={_apiKey}";
                        
                        Console.WriteLine($"[GeminiService] 🔄 Trying model: {model} (API: {apiVersion})");
                        
                        // Create request
                        var request = new HttpRequestMessage(HttpMethod.Post, url)
                        {
                            Content = content
                        };

                        response = await _httpClient.SendAsync(request);
                        var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
                        responseContent = await response.Content.ReadAsStringAsync();
                        
                        Console.WriteLine($"[GeminiService] ⏱️ Response received in {duration:F0}ms");
                        Console.WriteLine($"[GeminiService] 📊 Response status: {response.StatusCode}");

                        if (response.IsSuccessStatusCode)
                        {
                            workingModel = model;
                            workingApiVersion = apiVersion;
                            Console.WriteLine($"[GeminiService] ✅ Successfully connected to model: {model} (API: {apiVersion})");
                            break;
                        }
                        else
                        {
                            Console.WriteLine($"[GeminiService] ❌ Model {model} (API: {apiVersion}) failed: {response.StatusCode}");
                            if (responseContent.Length < 200)
                            {
                                Console.WriteLine($"[GeminiService] Error details: {responseContent}");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[GeminiService] ❌ Exception trying {model} (API: {apiVersion}): {ex.Message}");
                        continue;
                    }
                }

                if (response == null || !response.IsSuccessStatusCode)
                {
                    var errorMsg = responseContent ?? "No response received";
                    Console.WriteLine($"[GeminiService] ❌ All models failed. Last error: {errorMsg}");
                    ErrorLogger.Log(new Exception($"Gemini API error: All models failed. Last response: {errorMsg}"), _env);
                    return "I apologize, but I encountered an error while processing your request. Please try again later.";
                }

                Console.WriteLine($"[GeminiService] Using model: {workingModel}");
                Console.WriteLine($"[GeminiService] API version: {workingApiVersion}");

                Console.WriteLine($"[GeminiService] ✅ API call successful");
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
                        var firstPart = parts[0];
                        if (firstPart.TryGetProperty("text", out var textElement))
                        {
                            var responseText = textElement.GetString();
                            Console.WriteLine($"[GeminiService] ✅ Successfully extracted response");
                            Console.WriteLine($"[GeminiService] 💬 Response length: {responseText?.Length ?? 0} characters");
                            
                            if (string.IsNullOrEmpty(responseText))
                            {
                                Console.WriteLine($"[GeminiService] ⚠️ WARNING: Response text is empty");
                                return "I apologize, but I couldn't generate a response. Please try again.";
                            }

                            return responseText;
                        }
                    }
                }

                // If we got here, the response structure was unexpected
                Console.WriteLine($"[GeminiService] ❌ ERROR: Unexpected response structure");
                Console.WriteLine($"[GeminiService] 📄 Full response: {responseContent}");
                ErrorLogger.Log(new Exception($"Unexpected Gemini response structure: {responseContent}"), _env);
                return "I apologize, but I couldn't generate a response. Please try again.";
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
    }
}
