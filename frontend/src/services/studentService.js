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

  /**
   * Get student profile data
   * @returns {Promise<Object>}
   */
  async getProfile() {
    try {
      const response = await api.get('/student/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  /**
   * Update student profile (full name only)
   * @param {string} fullName - The full name
   * @returns {Promise<Object>}
   */
  async updateProfile(fullName) {
    try {
      const response = await api.put('/student/profile', { fullName });
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Change student password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @param {string} confirmPassword - Confirm new password
   * @returns {Promise<Object>}
   */
  async changePassword(currentPassword, newPassword, confirmPassword) {
    try {
      const response = await api.put('/student/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },
};

