import api from './api';

export const enrollmentService = {
  /**
   * Enroll in a course
   * @param {number} courseId - The ID of the course to enroll in
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async enroll(courseId) {
    try {
      const response = await api.post(`/student/enroll/${courseId}`);
      return {
        success: true,
        message: response.data.message || 'Enrollment successful',
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to enroll in course';
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Check if user is enrolled in a course
   * @param {number} courseId - The ID of the course to check
   * @returns {Promise<boolean>}
   */
  async isEnrolled(courseId) {
    try {
      // Get user's enrollments and check if courseId is in the list
      const response = await api.get('/student/enrollments');
      const enrollments = response.data || [];
      return enrollments.some((enrollment) => enrollment.courseId === courseId);
    } catch (error) {
      console.error('Error checking enrollment status:', error);
      return false;
    }
  },

  /**
   * Get all enrollments for the current user
   * @returns {Promise<Array>}
   */
  async getMyEnrollments() {
    try {
      const response = await api.get('/student/enrollments');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      return [];
    }
  },
};

