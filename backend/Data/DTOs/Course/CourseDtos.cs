using System;
using System.Collections.Generic;

namespace ids.Data.DTOs.Course
{
    public class CreateCourseDto
    {
        public string Title { get; set; }
        public string ShortDescription { get; set; }
        public string LongDescription { get; set; }
        public string Category { get; set; }
        public string Difficulty { get; set; }
        public string Thumbnail { get; set; }
        public bool IsPublished { get; set; }
    }

    public class UpdateCourseDto
    {
        public string? Title { get; set; }
        public string? ShortDescription { get; set; }
        public string? LongDescription { get; set; }
        public string? Category { get; set; }
        public string? Difficulty { get; set; }
        public string? Thumbnail { get; set; }
        public bool? IsPublished { get; set; }
    }

    public class CourseResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string ShortDescription { get; set; }
        public string LongDescription { get; set; }
        public string Category { get; set; }
        public string Difficulty { get; set; }
        public string Thumbnail { get; set; }
        public int CreatedBy { get; set; }
        public UserDto Creator { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsPublished { get; set; }
        public int EnrollmentCount { get; set; }
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
    }
}