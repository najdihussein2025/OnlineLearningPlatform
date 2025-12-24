import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CourseCard from '../../components/CourseCard/CourseCard';
import './Courses.css';

// Dummy course data
const dummyCourses = [
  {
    id: 1,
    title: 'Complete Web Development Bootcamp',
    description: 'Master HTML, CSS, JavaScript, React, Node.js, and more. Build real-world projects and land your dream job.',
    category: 'Web Development',
    difficulty: 'Beginner',
    duration: '12 weeks',
    instructor: 'Sarah Johnson',
    thumbnail: null,
  },
  {
    id: 2,
    title: 'Advanced Data Science with Python',
    description: 'Learn machine learning, data analysis, and visualization using Python, Pandas, and Scikit-learn.',
    category: 'Data Science',
    difficulty: 'Advanced',
    duration: '16 weeks',
    instructor: 'Dr. Michael Chen',
    thumbnail: null,
  },
  {
    id: 3,
    title: 'UI/UX Design Fundamentals',
    description: 'Master the principles of user interface and user experience design. Create beautiful, functional designs.',
    category: 'Design',
    difficulty: 'Beginner',
    duration: '8 weeks',
    instructor: 'Emily Rodriguez',
    thumbnail: null,
  },
  {
    id: 4,
    title: 'Business Strategy & Leadership',
    description: 'Develop strategic thinking and leadership skills. Learn to make data-driven business decisions.',
    category: 'Business',
    difficulty: 'Intermediate',
    duration: '10 weeks',
    instructor: 'James Anderson',
    thumbnail: null,
  },
  {
    id: 5,
    title: 'Full-Stack JavaScript Development',
    description: 'Build modern web applications using React, Node.js, Express, and MongoDB. Full-stack mastery.',
    category: 'Programming',
    difficulty: 'Intermediate',
    duration: '14 weeks',
    instructor: 'Alex Thompson',
    thumbnail: null,
  },
  {
    id: 6,
    title: 'Digital Marketing Mastery',
    description: 'Learn SEO, social media marketing, content strategy, and analytics. Grow your online presence.',
    category: 'Marketing',
    difficulty: 'Beginner',
    duration: '6 weeks',
    instructor: 'Lisa Martinez',
    thumbnail: null,
  },
  {
    id: 7,
    title: 'React Advanced Patterns',
    description: 'Deep dive into React hooks, context, performance optimization, and advanced state management.',
    category: 'Web Development',
    difficulty: 'Advanced',
    duration: '8 weeks',
    instructor: 'David Kim',
    thumbnail: null,
  },
  {
    id: 8,
    title: 'Machine Learning Fundamentals',
    description: 'Introduction to ML algorithms, neural networks, and deep learning. Hands-on projects included.',
    category: 'Data Science',
    difficulty: 'Intermediate',
    duration: '12 weeks',
    instructor: 'Dr. Michael Chen',
    thumbnail: null,
  },
  {
    id: 9,
    title: 'Mobile App Development with React Native',
    description: 'Build cross-platform mobile apps using React Native. iOS and Android development in one course.',
    category: 'Programming',
    difficulty: 'Intermediate',
    duration: '10 weeks',
    instructor: 'Alex Thompson',
    thumbnail: null,
  },
  {
    id: 10,
    title: 'Advanced Business Analytics',
    description: 'Master data analysis, visualization, and business intelligence tools. Make informed decisions.',
    category: 'Business',
    difficulty: 'Advanced',
    duration: '10 weeks',
    instructor: 'James Anderson',
    thumbnail: null,
  },
  {
    id: 11,
    title: 'Graphic Design Essentials',
    description: 'Learn typography, color theory, layout design, and Adobe Creative Suite. Create stunning visuals.',
    category: 'Design',
    difficulty: 'Beginner',
    duration: '8 weeks',
    instructor: 'Emily Rodriguez',
    thumbnail: null,
  },
  {
    id: 12,
    title: 'Content Marketing Strategy',
    description: 'Create engaging content, build your brand, and drive traffic. Content marketing that converts.',
    category: 'Marketing',
    difficulty: 'Intermediate',
    duration: '6 weeks',
    instructor: 'Lisa Martinez',
    thumbnail: null,
  },
];

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterSticky, setIsFilterSticky] = useState(false);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setCourses(dummyCourses);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handle sticky filter bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsFilterSticky(scrollPosition > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(dummyCourses.map(course => course.category))];
    return uniqueCategories.sort();
  }, []);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let filtered = [...courses];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(course => course.difficulty.toLowerCase() === selectedDifficulty.toLowerCase());
    }

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => b.id - a.id);
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
                {filteredCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
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

