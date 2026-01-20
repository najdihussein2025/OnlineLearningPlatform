import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import ProgressBar from '../../../components/student/ProgressBar/ProgressBar';
import api from '../../../services/api';
import { studentService } from '../../../services/studentService';
import * as offlineVideoService from '../../../services/offlineVideoService';
import './StudentLessons.css';

const StudentLessons = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get('course');
  const lessonId = searchParams.get('lesson');

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingLesson, setCompletingLesson] = useState(false);
  const [completionError, setCompletionError] = useState(null);
  
  // Course selection state
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  
  // Video progress tracking
  const videoRef = useRef(null);
  const lastSavedSecondsRef = useRef(0);

  // Offline video state
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineVideoUrl, setOfflineVideoUrl] = useState(null);

  // Find selected lesson (computed before useEffects that use it)
  const selectedLesson = useMemo(() => {
    if (!lessonId || !lessons || lessons.length === 0) {
      return null;
    }
    const parsedLessonId = parseInt(lessonId, 10);
    if (isNaN(parsedLessonId)) {
      return null;
    }
    return lessons.find(l => l && l.id === parsedLessonId) || null;
  }, [lessons, lessonId]);

  // Setup online/offline listeners and auto-sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming online
      offlineVideoService.syncOfflineData().catch(err => {
        console.error('Auto-sync failed:', err);
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check
    if (navigator.onLine) {
      offlineVideoService.syncOfflineData().catch(err => {
        console.error('Initial sync failed:', err);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load courses for selection when no courseId is provided
  useEffect(() => {
    const parsedCourseId = courseId ? parseInt(courseId, 10) : null;
    if (!parsedCourseId || isNaN(parsedCourseId)) {
      // Load courses for selection instead of redirecting
      let mounted = true;
      const loadCourses = async () => {
        try {
          setLoadingCourses(true);
          setError(null);
          
          const response = await api.get('/student/courses');
          if (!mounted) return;
          
          const coursesData = Array.isArray(response.data) ? response.data : [];
          const mappedCourses = coursesData
            .filter(c => c && c.courseId)
            .map(c => {
              // Backend returns progress as a number, not nested object
              let progressValue = Number(c.progress) || 0;
              // Backend returns status as string: "Completed", "InProgress", "NotStarted"
              // Ensure status is correctly mapped (handle case sensitivity)
              let status = c.status || 'NotStarted';
              if (typeof status === 'string') {
                status = status.trim();
                // Normalize status values
                if (status.toLowerCase() === 'completed') status = 'Completed';
                else if (status.toLowerCase() === 'inprogress' || status.toLowerCase() === 'in progress') status = 'InProgress';
                else if (status.toLowerCase() === 'notstarted' || status.toLowerCase() === 'not started') status = 'NotStarted';
              }
              
              // Get raw counts from backend
              const completedLessons = Number(c.completedLessonsCount) || 0;
              const totalLessons = Number(c.lessonsCount) || 0;
              const completedQuizzes = Number(c.completedQuizzesCount) || 0;
              const totalQuizzes = Number(c.quizzesCount) || 0;
              
              // If status is Completed, ensure progress is 100%
              if (status === 'Completed' && progressValue < 100) {
                console.warn(`Course ${c.courseId} is marked as Completed but progress is ${progressValue}%. Forcing to 100%.`);
                progressValue = 100;
              }
              
              // If progress is 100%, ensure status is Completed
              if (progressValue >= 100 && status !== 'Completed') {
                console.warn(`Course ${c.courseId} has 100% progress but status is ${status}. Forcing to Completed.`);
                status = 'Completed';
              }
              
              // Debug logging for completed courses
              if (status === 'Completed') {
                console.log(`Course ${c.courseId} (${c.title}): Status=Completed, Progress=${progressValue}%, Lessons=${completedLessons}/${totalLessons}, Quizzes=${completedQuizzes}/${totalQuizzes}`);
              }
              
              return {
                id: c.courseId,
                title: c.title || 'Untitled Course',
                instructor: c.instructor || 'N/A',
                progress: { progress: progressValue },
                status: status,
                completedLessons: completedLessons,
                totalLessons: totalLessons,
                completedQuizzes: completedQuizzes,
                totalQuizzes: totalQuizzes,
              };
            });
          
          setCourses(mappedCourses);
          setLoading(false);
        } catch (err) {
          console.error('Error loading courses:', err);
          if (!mounted) return;
          setError(err.response?.data?.message || err.message || 'Failed to load courses');
          setLoading(false);
        } finally {
          if (mounted) setLoadingCourses(false);
        }
      };
      
      loadCourses();
      return () => { mounted = false; };
    } else {
      // Reset courses when courseId is provided
      setCourses([]);
      setLoadingCourses(false);
    }
  }, [courseId]);

  // Load course and lessons data
  useEffect(() => {
    // Safely parse courseId from query string
    const parsedCourseId = courseId ? parseInt(courseId, 10) : null;
    if (!parsedCourseId || isNaN(parsedCourseId)) {
      // Don't load lessons if no courseId
      setLoading(false);
      return;
    }

    let mounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch course details
        const courseResponse = await api.get(`/student/courses/${parsedCourseId}`);
        if (!mounted) return;
        
        // Handle 404 - course not found or not enrolled
        if (courseResponse.status === 404) {
          setError('Course not found or you are not enrolled');
          return;
        }
        
        // API returns nested structure: { course: { ... }, enrollment: { ... }, progress: { ... }, lessons: [...], quizzes: [...] }
        // Extract course data from nested structure - preserve progress from backend
        const responseData = courseResponse.data || {};
        const courseData = responseData.course || responseData;
        if (!courseData) {
          setError('Course data not available');
          return;
        }
        // Ensure progress and enrollment are included from backend response
        const courseWithProgress = {
          ...courseData,
          progress: responseData.progress || courseData.progress || { progress: 0 },
          enrollment: responseData.enrollment || null // Include enrollment status
        };
        setCourse(courseWithProgress);

        // Fetch lessons with completion status
        // Pass lesson query param if provided (safely parse it)
        const parsedLessonId = lessonId ? parseInt(lessonId, 10) : null;
        const lessonsUrl = parsedLessonId && !isNaN(parsedLessonId)
          ? `/student/courses/${parsedCourseId}/lessons?lesson=${parsedLessonId}`
          : `/student/courses/${parsedCourseId}/lessons`;
        
        console.log(`Fetching lessons from: ${lessonsUrl}`);
        const lessonsResponse = await api.get(lessonsUrl);
        if (!mounted) return;
        
        console.log('Lessons API response:', lessonsResponse.data);
        
        // Handle 404 - course not found or not enrolled
        if (lessonsResponse.status === 404) {
          setError('Course not found or you are not enrolled');
          return;
        }
        
        // API returns { courseId, lessons: [...], currentLessonId }
        // Handle both object response and array response (for backward compatibility)
        let lessonsData = [];
        if (lessonsResponse.data) {
          if (Array.isArray(lessonsResponse.data)) {
            // Backend returned array directly (legacy/error case)
            console.log('Lessons response is array directly');
            lessonsData = lessonsResponse.data;
          } else if (lessonsResponse.data.lessons && Array.isArray(lessonsResponse.data.lessons)) {
            // Backend returned object with lessons property (expected)
            console.log(`Found ${lessonsResponse.data.lessons.length} lessons in response.lessons`);
            lessonsData = lessonsResponse.data.lessons;
          } else {
            console.error('Unexpected lessons response structure:', lessonsResponse.data);
            console.error('Response keys:', Object.keys(lessonsResponse.data || {}));
            lessonsData = [];
          }
        } else {
          console.warn('Lessons response data is null or undefined');
        }
        
        // Ensure lessonsData is always an array
        if (!Array.isArray(lessonsData)) {
          console.error('Lessons data is not an array:', lessonsData, typeof lessonsData);
          lessonsData = [];
        }
        
        setLessons(lessonsData);
        
        // Log for debugging
        if (lessonsData.length === 0) {
          console.warn(`No lessons found for course ${parsedCourseId}. Full response:`, JSON.stringify(lessonsResponse.data, null, 2));
        } else {
          console.log(`✅ Successfully loaded ${lessonsData.length} lessons for course ${parsedCourseId}`);
          console.log('Lesson IDs:', lessonsData.map(l => l.id));
        }

        // Auto-select first lesson if none selected and lessons exist
        if (lessonsData.length > 0 && !parsedLessonId) {
          const firstLessonId = lessonsData[0]?.id;
          if (firstLessonId) {
            navigate(`/student/lessons?course=${parsedCourseId}&lesson=${firstLessonId}`, { replace: true });
          }
        }
      } catch (err) {
        console.error('Error loading course lessons:', err);
        if (!mounted) return;
        
        // Handle specific error cases
        if (err.response?.status === 404) {
          setError('Course not found or you are not enrolled. Please check your enrollment.');
        } else if (err.response?.status === 401) {
          setError('Please log in to access lessons');
          // Redirect will be handled by API interceptor
        } else {
          const errorMessage = err.response?.data?.message 
            || err.message 
            || 'Failed to load course lessons';
          setError(errorMessage);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [courseId, lessonId, navigate]);

  // Check if video is downloaded and load offline video URL
  useEffect(() => {
    if (!selectedLesson || !selectedLesson.videoUrl) {
      setIsDownloaded(false);
      setOfflineVideoUrl(null);
      return;
    }

    let mounted = true;
    const checkDownload = async () => {
      try {
        const downloaded = await offlineVideoService.isVideoDownloaded(selectedLesson.id);
        if (!mounted) return;
        setIsDownloaded(downloaded);

        if (downloaded) {
          const url = await offlineVideoService.getDownloadedVideoUrl(selectedLesson.id);
          if (!mounted) return;
          setOfflineVideoUrl(url);
          
          // Update video source if video element exists
          if (videoRef.current) {
            videoRef.current.src = url;
            videoRef.current.load();
          }
        } else {
          setOfflineVideoUrl(null);
          // Use online source if video element exists
          if (videoRef.current) {
            videoRef.current.src = selectedLesson.videoUrl;
            videoRef.current.load();
          }
        }
      } catch (error) {
        console.error('Error checking download status:', error);
        if (!mounted) return;
        setIsDownloaded(false);
        setOfflineVideoUrl(null);
      }
    };

    checkDownload();
    return () => { 
      mounted = false;
      // Clean up blob URL when component unmounts or lesson changes
      if (offlineVideoUrl && offlineVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(offlineVideoUrl);
      }
    };
  }, [selectedLesson?.id]);

  // Handle video progress tracking and resume
  useEffect(() => {
    if (!selectedLesson || !videoRef.current) return;

    const video = videoRef.current;
    const lessonType = getLessonType(selectedLesson);
    
    // Only track progress for video lessons
    if (lessonType !== 'video' || !selectedLesson.videoUrl) return;

    // Set initial video position from saved progress
    const lastWatchedSeconds = selectedLesson.lastWatchedSeconds || 0;
    if (lastWatchedSeconds > 0 && video.readyState >= 2) {
      // Video metadata is loaded
      video.currentTime = lastWatchedSeconds;
    } else {
      // Wait for metadata to load
      const handleLoadedMetadata = () => {
        if (lastWatchedSeconds > 0) {
          video.currentTime = lastWatchedSeconds;
        }
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
    }

    // Load offline progress if available
    const loadOfflineProgress = async () => {
      try {
        const offlineProgress = await offlineVideoService.getOfflineProgress(selectedLesson.id);
        if (offlineProgress > 0 && offlineProgress > (selectedLesson.lastWatchedSeconds || 0)) {
          // Use offline progress if it's greater
          if (video.readyState >= 2) {
            video.currentTime = offlineProgress;
          } else {
            const handleLoadedMetadata = () => {
              video.currentTime = offlineProgress;
              video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            };
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
          }
        }
      } catch (error) {
        console.error('Error loading offline progress:', error);
      }
    };

    loadOfflineProgress();

    // Save progress periodically (every 10 seconds of playback) and on pause
    const saveProgress = async (currentTime) => {
      const seconds = Math.floor(currentTime);
      
      // Only save if progress changed significantly (at least 10 seconds of playback)
      if (Math.abs(seconds - lastSavedSecondsRef.current) < 10 && seconds > 0) {
        return;
      }

      try {
        // Save to offline storage first
        await offlineVideoService.saveOfflineProgress(selectedLesson.id, seconds);
        
        // Try to save to backend if online
        if (navigator.onLine) {
          try {
            await studentService.saveVideoProgress(selectedLesson.id, seconds);
          } catch (error) {
            console.error('Failed to save video progress to backend:', error);
            // Progress is already saved offline, so it will sync later
          }
        }
        
        lastSavedSecondsRef.current = seconds;
      } catch (error) {
        console.error('Failed to save video progress:', error);
        // Don't show error to user, just log it
      }
    };

    // Handle timeupdate - save progress every 10 seconds of playback time
    const handleTimeUpdate = () => {
      if (video && !video.paused) {
        const currentSeconds = Math.floor(video.currentTime);
        // Save if we've progressed at least 10 seconds since last save
        if (Math.abs(currentSeconds - lastSavedSecondsRef.current) >= 10) {
          saveProgress(video.currentTime);
        }
      }
    };

    // Handle pause - save immediately
    const handlePause = () => {
      saveProgress(video.currentTime);
    };

    // Handle visibility change - save when tab becomes hidden
    const handleVisibilityChange = () => {
      if (document.hidden && video && !isNaN(video.currentTime) && video.currentTime > 0) {
        saveProgress(video.currentTime);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('pause', handlePause);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('pause', handlePause);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Save progress on cleanup (component unmount or lesson change)
      if (video && !isNaN(video.currentTime) && video.currentTime > 0) {
        const seconds = Math.floor(video.currentTime);
        if (seconds > 0) {
          studentService.saveVideoProgress(selectedLesson.id, seconds).catch(err => {
            console.error('Failed to save video progress on cleanup:', err);
          });
        }
      }
    };
  }, [lessonId, selectedLesson?.id, selectedLesson?.lastWatchedSeconds]);
  const currentLessonIndex = lessons.findIndex(l => l.id === selectedLesson?.id);
  const nextLesson = lessons[currentLessonIndex + 1];
  const prevLesson = lessons[currentLessonIndex - 1];

  // Use backend-provided progress - DO NOT calculate on frontend
  // Backend progress includes both lessons and quizzes
  const progress = course?.progress?.progress !== undefined 
    ? Math.max(0, Math.min(100, Number(course.progress.progress) || 0))
    : 0;

  // Determine lesson type
  const getLessonType = (lesson) => {
    if (lesson.videoUrl) return 'video';
    if (lesson.pdfUrl) return 'pdf';
    if (lesson.externalUrl) return 'external';
    if (lesson.content && lesson.content.length > 500) return 'article';
    return 'article'; // default
  };

  // Format duration from minutes
  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Handle download video
  const handleDownloadVideo = async () => {
    if (!selectedLesson || !selectedLesson.videoUrl || isDownloading) return;

    try {
      setIsDownloading(true);
      setDownloadError(null);
      setDownloadProgress(0);

      await offlineVideoService.downloadVideo(selectedLesson.id, (progress) => {
        setDownloadProgress(progress);
      });

      // Refresh download status
      const downloaded = await offlineVideoService.isVideoDownloaded(selectedLesson.id);
      setIsDownloaded(downloaded);
      
      if (downloaded) {
        const url = await offlineVideoService.getDownloadedVideoUrl(selectedLesson.id);
        setOfflineVideoUrl(url);
      }
    } catch (error) {
      console.error('Error downloading video:', error);
      setDownloadError(error.response?.data?.message || error.message || 'Failed to download video');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Handle delete downloaded video
  const handleDeleteDownload = async () => {
    if (!selectedLesson || !isDownloaded) return;

    try {
      await offlineVideoService.deleteDownloadedVideo(selectedLesson.id);
      setIsDownloaded(false);
      setOfflineVideoUrl(null);
      
      // If video is currently playing from offline source, reload with online source
      if (videoRef.current && offlineVideoUrl) {
        videoRef.current.src = selectedLesson.videoUrl;
        videoRef.current.load();
      }
    } catch (error) {
      console.error('Error deleting downloaded video:', error);
    }
  };

  // Handle mark lesson as complete
  const handleMarkComplete = async () => {
    if (!selectedLesson || completingLesson || selectedLesson.isCompleted) return;

    try {
      setCompletingLesson(true);
      setCompletionError(null);

      // Optimistic UI update - mark lesson as completed immediately
      setLessons(prevLessons => 
        prevLessons.map(lesson => 
          lesson.id === selectedLesson.id 
            ? { ...lesson, isCompleted: true }
            : lesson
        )
      );

      // Save offline completion first
      await offlineVideoService.saveOfflineCompletion(selectedLesson.id);

      // Try to complete on backend if online
      if (navigator.onLine) {
        try {
          await api.post(`/student/lessons/${selectedLesson.id}/complete`);

          // Refresh lessons to get updated completion status from server
          const lessonsUrl = selectedLesson?.id 
            ? `/student/courses/${courseId}/lessons?lesson=${selectedLesson.id}`
            : `/student/courses/${courseId}/lessons`;
          const lessonsResponse = await api.get(lessonsUrl);
          // API returns { courseId, lessons: [...], currentLessonId }
          let lessonsData = [];
          if (lessonsResponse.data) {
            if (Array.isArray(lessonsResponse.data)) {
              lessonsData = lessonsResponse.data;
            } else if (Array.isArray(lessonsResponse.data.lessons)) {
              lessonsData = lessonsResponse.data.lessons;
            }
          }
          setLessons(lessonsData);

          // Refresh course to get updated progress and enrollment status
          const courseResponse = await api.get(`/student/courses/${courseId}`);
          // API returns nested structure: { course: { ... }, enrollment: { ... }, progress: { ... }, lessons: [...], quizzes: [...] }
          const responseData = courseResponse.data || {};
          const courseData = responseData.course || responseData;
          const progressData = responseData.progress; // Extract progress data (includes progress percentage from backend)
          const enrollmentData = responseData.enrollment; // Extract enrollment data (includes status)
          // Set course with progress and enrollment from backend
          setCourse({ 
            ...courseData, 
            progress: progressData,
            enrollment: enrollmentData // Store enrollment to track completion status
          });
        } catch (err) {
          // Handle duplicate completion gracefully (409 Conflict)
          if (err.response?.status === 409) {
            // Lesson already completed - this is fine, just refresh to get latest state
            // Don't revert optimistic update since lesson is actually completed
            const lessonsUrl = selectedLesson?.id 
              ? `/student/courses/${courseId}/lessons?lesson=${selectedLesson.id}`
              : `/student/courses/${courseId}/lessons`;
            try {
              const lessonsResponse = await api.get(lessonsUrl);
              let lessonsData = [];
              if (lessonsResponse.data) {
                if (Array.isArray(lessonsResponse.data)) {
                  lessonsData = lessonsResponse.data;
                } else if (Array.isArray(lessonsResponse.data.lessons)) {
                  lessonsData = lessonsResponse.data.lessons;
                }
              }
              setLessons(lessonsData);
              
              // Refresh course progress and enrollment status
              const courseResponse = await api.get(`/student/courses/${courseId}`);
              const responseData = courseResponse.data || {};
              const courseData = responseData.course || responseData;
              const progressData = responseData.progress; // Extract progress data (includes progress percentage from backend)
              const enrollmentData = responseData.enrollment; // Extract enrollment data (includes status)
              // Set course with progress and enrollment from backend
              setCourse({ 
                ...courseData, 
                progress: progressData,
                enrollment: enrollmentData // Store enrollment to track completion status
              });
            } catch (refreshErr) {
              console.error('Error refreshing lessons after duplicate completion:', refreshErr);
            }
          } else {
            // Revert optimistic update on error (except for duplicate)
            setLessons(prevLessons => 
              prevLessons.map(lesson => 
                lesson.id === selectedLesson.id 
                  ? { ...lesson, isCompleted: false }
                  : lesson
              )
            );
            console.error('Error completing lesson on backend:', err);
            const errorMessage = err.response?.data?.message 
              || err.message 
              || 'Failed to complete lesson';
            setCompletionError(errorMessage);
            // Completion is saved offline, will sync later
          }
        }
      }
    } catch (err) {
      // Revert optimistic update on error
      setLessons(prevLessons => 
        prevLessons.map(lesson => 
          lesson.id === selectedLesson.id 
            ? { ...lesson, isCompleted: false }
            : lesson
        )
      );
      console.error('Error completing lesson:', err);
      const errorMessage = err.response?.data?.message 
        || err.message 
        || 'Failed to complete lesson';
      setCompletionError(errorMessage);
    } finally {
      setCompletingLesson(false);
    }
  };

  // Get lesson type icon
  const getLessonTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
          </svg>
        );
      case 'pdf':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 11H17M7 15H17M7 19H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'external':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'article':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19.5C4 18.6716 4.67157 18 5.5 18H18.5C19.3284 18 20 18.6716 20 19.5V20.5C20 21.3284 19.3284 22 18.5 22H5.5C4.67157 22 4 21.3284 4 20.5V19.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 2H20V14H4V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  // Course selection state - show when no courseId is provided
  const parsedCourseId = courseId ? parseInt(courseId, 10) : null;
  if (!parsedCourseId || isNaN(parsedCourseId)) {
    if (loadingCourses || loading) {
      return (
        <div className="student-lessons-page">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading courses...</p>
          </div>
        </div>
      );
    }

    if (error && courses.length === 0) {
      return (
        <div className="student-lessons-page">
          <div className="error-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h3>Error loading courses</h3>
            <p>{error}</p>
            <button 
              className="btn-primary" 
              onClick={() => window.location.reload()}
              style={{ marginTop: 'var(--spacing-lg)' }}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    // Course selection UI
    return (
      <div className="student-lessons-page">
        <div className="course-selection-container">
          <div className="course-selection-header">
            <h1>Select a Course</h1>
            <p>Choose a course to view its lessons</p>
          </div>
          
          {courses.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>No courses available</h3>
              <p>You haven't enrolled in any courses yet.</p>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/student/courses')}
                style={{ marginTop: 'var(--spacing-lg)' }}
              >
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="course-selection-grid">
              {courses.map((c) => {
                const progressValue = c.progress?.progress || 0;
                const getStatusBadge = () => {
                  // Backend returns: "Completed", "InProgress", "NotStarted"
                  if (c.status === 'Completed') {
                    return <span className="status-badge status-completed">Completed</span>;
                  } else if (c.status === 'InProgress') {
                    return <span className="status-badge status-in-progress">In Progress</span>;
                  }
                  return <span className="status-badge status-not-started">Not Started</span>;
                };

                return (
                  <div
                    key={c.id}
                    className="course-selection-card"
                    onClick={() => navigate(`/student/lessons?course=${c.id}`)}
                  >
                    <div className="course-selection-card-header">
                      <h3>{c.title}</h3>
                      {getStatusBadge()}
                    </div>
                    <div className="course-selection-card-instructor">
                      <span>Instructor: {c.instructor || 'N/A'}</span>
                    </div>
                    <div className="course-selection-card-progress">
                      <div className="progress-info">
                        <span>Progress: {Math.round(progressValue)}%</span>
                      </div>
                      <ProgressBar progress={progressValue} size="small" />
                    </div>
                    <div className="course-selection-card-stats">
                      <div className="stat-item">
                        <span className="stat-label">Lessons</span>
                        <span className="stat-value">{c.completedLessons}/{c.totalLessons}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Quizzes</span>
                        <span className="stat-value">{c.completedQuizzes}/{c.totalQuizzes}</span>
                      </div>
                    </div>
                    <div className="course-selection-card-action">
                      <button className="btn-primary btn-full-width">
                        View Lessons
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="student-lessons-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading lessons...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="student-lessons-page">
        <div className="error-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>Error loading lessons</h3>
          <p>{error}</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/student/courses')}
            style={{ marginTop: 'var(--spacing-lg)' }}
          >
            Back to My Courses
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!course || lessons.length === 0) {
    return (
      <div className="student-lessons-page">
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>No lessons available</h3>
          <p>This course doesn't have any lessons yet.</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/student/courses')}
            style={{ marginTop: 'var(--spacing-lg)' }}
          >
            Back to My Courses
          </button>
        </div>
      </div>
    );
  }

  // No lesson selected or lesson not found
  if (!selectedLesson) {
    return (
      <div className="student-lessons-page">
        <div className="error-state">
          <h3>Lesson not found</h3>
          <p>The selected lesson could not be found.</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate(`/student/lessons?course=${courseId}&lesson=${lessons[0]?.id}`)}
            style={{ marginTop: 'var(--spacing-lg)' }}
          >
            Go to First Lesson
          </button>
        </div>
      </div>
    );
  }

  const lessonType = getLessonType(selectedLesson);

  return (
    <div className="student-lessons-page">
      <div className="lessons-layout">
        {/* Sidebar - Lessons List */}
        <aside className="lessons-sidebar">
          <div className="lessons-sidebar-header">
            <h2 className="course-title">{course?.title || 'Course'}</h2>
            <ProgressBar progress={progress} size="small" />
          </div>
          <div className="lessons-list">
            {lessons.map((lesson, index) => {
              const isCompleted = lesson.isCompleted;
              const isActive = lesson.id === selectedLesson.id;
              const type = getLessonType(lesson);
              
              return (
                <Link
                  key={lesson.id}
                  to={`/student/lessons?course=${courseId}&lesson=${lesson.id}`}
                  className={`lesson-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  <div className="lesson-item-number">{index + 1}</div>
                  <div className="lesson-item-content">
                    <div className="lesson-item-header">
                      <span className="lesson-item-type">{getLessonTypeIcon(type)}</span>
                      <h3 className="lesson-item-title">{lesson.title}</h3>
                    </div>
                    <div className="lesson-item-meta">
                      <span className="lesson-duration">{formatDuration(lesson.estimatedDuration)}</span>
                      {isCompleted && (
                        <span className="lesson-completed-badge">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main Content - Lesson View */}
        <main className="lesson-content">
          <div className="lesson-header">
            <div className="lesson-breadcrumb">
              <Link to="/student/courses">My Courses</Link>
              <span>/</span>
              <span>{course?.title || 'Course'}</span>
            </div>
            <h1 className="lesson-title">{selectedLesson.title}</h1>
            <div className="lesson-meta">
              <span className="lesson-type-badge">
                {getLessonTypeIcon(lessonType)}
                {lessonType.charAt(0).toUpperCase() + lessonType.slice(1)}
              </span>
              <span className="lesson-duration-badge">{formatDuration(selectedLesson.estimatedDuration)}</span>
              {selectedLesson.isCompleted && (
                <span className="lesson-completed-badge-main">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Completed
                </span>
              )}
            </div>
          </div>

          <div className="lesson-player">
            {lessonType === 'video' && selectedLesson.videoUrl ? (
              <div className="video-container">
                {/* Online/Offline indicator */}
                {!isOnline && (
                  <div className="offline-indicator" style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
                    </svg>
                    Offline Mode
                  </div>
                )}
                
                {/* Download button */}
                {selectedLesson.videoUrl && (
                  <div className="video-download-controls" style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 10,
                    display: 'flex',
                    gap: '8px'
                  }}>
                    {!isDownloaded ? (
                      <button
                        onClick={handleDownloadVideo}
                        disabled={isDownloading || !isOnline}
                        className="btn-download"
                        style={{
                          background: isOnline ? 'rgba(0, 0, 0, 0.7)' : 'rgba(100, 100, 100, 0.7)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          cursor: isDownloading || !isOnline ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          opacity: isDownloading || !isOnline ? 0.6 : 1
                        }}
                        title={!isOnline ? 'Requires internet connection' : 'Download for offline viewing'}
                      >
                        {isDownloading ? (
                          <>
                            <div className="spinner-small" style={{ width: '14px', height: '14px' }}></div>
                            {Math.round(downloadProgress)}%
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M19 12V19H5V12H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12H19ZM13 12.67L15.59 10.09L17 11.5L12 16.5L7 11.5L8.41 10.09L11 12.67V3H13V12.67Z" fill="currentColor"/>
                            </svg>
                            Download
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleDeleteDownload}
                        className="btn-delete-download"
                        style={{
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title="Delete downloaded video"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                        </svg>
                        Downloaded
                      </button>
                    )}
                  </div>
                )}

                <video 
                  ref={videoRef}
                  controls 
                  className="lesson-video"
                  src={offlineVideoUrl || selectedLesson.videoUrl}
                >
                  <source src={offlineVideoUrl || selectedLesson.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {downloadError && (
                  <div className="error-message" style={{
                    marginTop: '8px',
                    color: 'var(--error-color, #dc3545)',
                    fontSize: 'var(--font-size-sm)'
                  }}>
                    {downloadError}
                  </div>
                )}
              </div>
            ) : lessonType === 'pdf' && selectedLesson.pdfUrl ? (
              <div className="pdf-container" style={{
                width: '100%',
                height: '600px',
                border: '1px solid var(--border-color, #e0e0e0)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <iframe
                  src={selectedLesson.pdfUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  title="PDF Viewer"
                />
              </div>
            ) : lessonType === 'external' && selectedLesson.externalUrl ? (
              <div className="external-url-container" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px',
                padding: 'var(--spacing-lg)',
                background: 'var(--background-secondary, #f5f5f5)',
                borderRadius: '8px'
              }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5 }}>
                  <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3 style={{ margin: 'var(--spacing-md) 0', color: 'var(--text-primary)' }}>External Resource</h3>
                <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Click the button below to open the external resource in a new window.
                </p>
                <a 
                  href={selectedLesson.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Open Resource
                </a>
              </div>
            ) : (
              <div className="article-content">
                <div dangerouslySetInnerHTML={{ __html: selectedLesson.content || '<p>No content available for this lesson.</p>' }} />
              </div>
            )}
          </div>

          <div className="lesson-actions">
            {!selectedLesson.isCompleted && (
              <button 
                className="btn-mark-complete" 
                onClick={handleMarkComplete}
                disabled={completingLesson}
              >
                {completingLesson ? (
                  <>
                    <div className="spinner-small"></div>
                    Completing...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Mark as Completed
                  </>
                )}
              </button>
            )}
            {completionError && (
              <div className="error-message" style={{ marginTop: 'var(--spacing-md)', color: 'var(--error-color, #dc3545)', fontSize: 'var(--font-size-sm)' }}>
                {completionError}
              </div>
            )}
          </div>

          <div className="lesson-navigation">
            {prevLesson && (
              <Link
                to={`/student/lessons?course=${courseId}&lesson=${prevLesson.id}`}
                className="nav-button nav-prev"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <span className="nav-label">Previous</span>
                  <span className="nav-title">{prevLesson.title}</span>
                </div>
              </Link>
            )}
            {nextLesson && (
              <Link
                to={`/student/lessons?course=${courseId}&lesson=${nextLesson.id}`}
                className="nav-button nav-next"
              >
                <div>
                  <span className="nav-label">Next</span>
                  <span className="nav-title">{nextLesson.title}</span>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLessons;
