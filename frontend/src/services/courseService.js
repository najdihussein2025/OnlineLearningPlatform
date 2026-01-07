import api from './api';

export const courseService = {
  /**
   * Get all published courses
   * @returns {Promise<Array>}
   */
  async getAllCourses() {
    try {
      const response = await api.get('/courses');
      // Filter only published courses
      const courses = response.data || [];
      return courses.filter(course => course.isPublished || course.IsPublished);
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  },

  /**
   * Get a single course by ID
   * @param {number} courseId - The ID of the course
   * @returns {Promise<Object|null>}
   */
  async getCourse(courseId) {
    try {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course:', error);
      return null;
    }
  },
};

