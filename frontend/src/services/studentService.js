import api from './api';

export const studentService = {
  /**
   * Get student dashboard data with aggregated progress
   * @returns {Promise<Object>}
   */
  async getDashboard() {
    try {
      const response = await api.get('/student/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  },

  /**
   * Save video progress for a lesson
   * @param {number} lessonId - The lesson ID
   * @param {number} lastWatchedSeconds - The last watched timestamp in seconds
   * @returns {Promise<Object>}
   */
  async saveVideoProgress(lessonId, lastWatchedSeconds) {
    try {
      const response = await api.post(`/student/lessons/${lessonId}/video-progress`, {
        lastWatchedSeconds: Math.floor(lastWatchedSeconds)
      });
      return response.data;
    } catch (error) {
      console.error('Error saving video progress:', error);
      throw error;
    }
  },

  /**
   * Get download URL for a lesson video
   * @param {number} lessonId - The lesson ID
   * @param {string} deviceId - Optional device ID
   * @returns {Promise<Object>}
   */
  async getDownloadUrl(lessonId, deviceId = null) {
    try {
      const response = await api.get(`/student/lessons/${lessonId}/download-url`, {
        params: deviceId ? { deviceId } : {}
      });
      return response.data;
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  },
};

