import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CourseCard from '../../components/CourseCard/CourseCard';
import { courseService } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { useAuth } from '../../context/AuthContext';
import { useToastContext } from '../../context/ToastContext';
import './Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterSticky, setIsFilterSticky] = useState(false);
  const { isAuthenticated, role } = useAuth();
  const { success, error } = useToastContext();

  const isStudent = isAuthenticated && role?.toLowerCase() === 'student';

  // Fetch courses and enrollment status
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [coursesData, enrollmentsData] = await Promise.all([
          courseService.getAllCourses(),
          isStudent ? enrollmentService.getMyEnrollments() : Promise.resolve([]),
        ]);

        if (!mounted) return;

        setCourses(coursesData);
        if (isStudent && enrollmentsData) {
          const enrolledIds = new Set(enrollmentsData.map(e => e.courseId));
          setEnrolledCourseIds(enrolledIds);
        }
      } catch (err) {
        console.error('Error loading courses:', err);
        error('Failed to load courses');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [isStudent, error]);

  // Handle sticky filter bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsFilterSticky(scrollPosition > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle enrollment
  const handleEnroll = async (courseId) => {
    if (!isStudent) return;

    setEnrollingCourseId(courseId);
    try {
      const result = await enrollmentService.enroll(courseId);
      if (result.success) {
        success(result.message || 'Successfully enrolled in course!');
        // Update enrollment status
        setEnrolledCourseIds(prev => new Set([...prev, courseId]));
      } else {
        error(result.error || 'Failed to enroll in course');
      }
    } catch (err) {
      error('An error occurred while enrolling');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(courses.map(course => course.category || course.Category))];
    return uniqueCategories.sort();
  }, [courses]);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let filtered = [...courses];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(course => {
        const title = (course.title || course.Title || '').toLowerCase();
        const description = (course.shortDescription || course.ShortDescription || course.description || course.Description || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return title.includes(query) || description.includes(query);
      });
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => 
        (course.category || course.Category) === selectedCategory
      );
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(course => 
        (course.difficulty || course.Difficulty)?.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => {
        const aId = a.id || a.Id || 0;
        const bId = b.id || b.Id || 0;
        return bId - aId;
      });
    } else if (sortBy === 'popular') {
      // Simulate popularity (random for demo)
      filtered.sort(() => Math.random() - 0.5);
    }

    return filtered;
  }, [courses, searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  return (
    <div className="courses-page">
      {/* Page Header / Hero */}
      <section className="courses-hero">
        <div className="container">
          <div className="courses-hero-content">
            <h1 className="courses-hero-title">Explore Our Courses</h1>
            <p className="courses-hero-subtitle">
              Browse high-quality courses created by expert instructors.
            </p>
            <div className="courses-hero-search">
              <div className="search-input-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <div className={`courses-filters ${isFilterSticky ? 'filters-sticky' : ''}`}>
        <div className="container">
          <div className="filters-container">
            <div className="filter-group">
              <label htmlFor="category-filter" className="filter-label">Category</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="difficulty-filter" className="filter-label">Difficulty</label>
              <select
                id="difficulty-filter"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="sort-filter" className="filter-label">Sort By</label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
            {(searchQuery || selectedCategory !== 'all' || selectedDifficulty !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                }}
                className="filter-clear"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <section className="courses-section">
        <div className="container">
          {loading ? (
            <div className="courses-grid">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="course-card-skeleton">
                  <div className="skeleton-thumbnail"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-line skeleton-title"></div>
                    <div className="skeleton-line skeleton-description"></div>
                    <div className="skeleton-line skeleton-description"></div>
                    <div className="skeleton-line skeleton-meta"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <>
              <div className="courses-results">
                <p className="results-count">
                  {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} found
                </p>
              </div>
              <div className="courses-grid">
                {filteredCourses.map(course => {
                  const courseId = course.id || course.Id;
                  const isEnrolled = enrolledCourseIds.has(courseId);
                  return (
                    <CourseCard
                      key={courseId}
                      course={{
                        id: courseId,
                        title: course.title || course.Title,
                        description: course.shortDescription || course.ShortDescription || course.description || course.Description,
                        category: course.category || course.Category,
                        difficulty: course.difficulty || course.Difficulty,
                        thumbnail: course.thumbnail || course.Thumbnail,
                      }}
                      isEnrolled={isEnrolled}
                      onEnroll={handleEnroll}
                      isEnrolling={enrollingCourseId === courseId}
                      showEnrollButton={isStudent}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="courses-empty">
              <div className="empty-icon">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="empty-title">No courses found</h2>
              <p className="empty-description">
                Try adjusting your filters or search query to find what you're looking for.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                }}
                className="btn btn-primary"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!loading && filteredCourses.length > 0 && (
        <section className="courses-cta">
          <div className="container">
            <div className="cta-content">
              <h2 className="cta-title">Ready to start learning?</h2>
              <p className="cta-subtitle">
                Join thousands of students already learning on our platform.
              </p>
              <Link to="/register" className="btn btn-primary btn-large">
                Create Free Account
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Courses;

