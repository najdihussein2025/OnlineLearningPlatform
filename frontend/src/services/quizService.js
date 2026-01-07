import api from './api';

export const quizService = {
  /**
   * Get quiz details with questions for taking the quiz
   * @param {number} quizId - The ID of the quiz
   * @returns {Promise<Object|null>}
   */
  async getQuizForAttempt(quizId) {
    try {
      const response = await api.get(`/student/quizzes/${quizId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  },

  /**
   * Submit a quiz attempt
   * @param {number} quizId - The ID of the quiz
   * @param {Array} answers - Array of { questionId, selectedAnswerIds }
   * @returns {Promise<Object>}
   */
  async submitQuizAttempt(quizId, answers) {
    try {
      const response = await api.post(`/student/quizzes/${quizId}/attempt`, {
        answers: answers
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      throw error;
    }
  },
};

