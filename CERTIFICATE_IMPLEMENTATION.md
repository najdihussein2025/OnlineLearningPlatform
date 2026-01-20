# Certificate System Implementation

## Overview
This document describes the updated certificate system for the Online Learning Platform. Certificates are now only issued to students who have **completed** their courses, and the PDF includes a personalized congratulations message with the student's name and course name.

## Changes Made

### 1. Backend - Models & DTOs

#### Updated: `Models/Certificate.cs`
- Structure remains the same
- Used to store issued certificates with student, course, and verification code

#### Updated: `Data/DTOs/Certificate/CertificateDtos.cs`
- **New DTO**: `GenerateCertificateDto` - Used to request certificate generation
  - `UserId`: Student ID
  - `CourseId`: Course ID

- **Updated**: `CertificateResponseDto` - Enhanced response object
  - Added `StudentName`: Student's full name
  - Added `CourseName`: Course title
  - Added `VerificationCode`: Unique certificate verification code

### 2. Backend - Services

#### Updated: `Services/CertificatePdfService.cs`
- Enhanced PDF generation with personalized congratulations message
- Added "Congratulations!" message after course title
- Displays student name prominently (32pt bold)
- Includes:
  - Platform name
  - Certificate of Completion title
  - Student name
  - Course name
  - Congratulations message
  - Verification code
  - Completion date
  - Instructor information

### 3. Backend - Controllers

#### Updated: `Controllers/CertificatesController.cs`
- Injected `CertificatePdfService` for PDF generation
- **New Endpoint**: `GET /api/certificates/completed-enrollments`
  - Returns list of students with completed enrollments
  - Includes student name, course name, and completion date
  - Used to identify eligible students for certification

- **New Endpoint**: `POST /api/certificates/generate`
  - Validates that the enrollment is completed (status = Completed)
  - Prevents duplicate certificates
  - Generates unique verification code
  - Creates certificate record in database
  - Response includes certificate ID and verification code

- **Updated**: `GET /api/certificates`
  - Now includes student name, course name, and verification code in response
  - Eager loads User and Course relationships

### 4. Frontend - Admin Certificates Page

#### Updated: `frontend/src/pages/Admin/Certificates/AdminCertificates.js`
- **Fetches real data** from backend instead of mock data
- **Two sections**:
  1. **Issued Certificates Table**: Shows all certificates already issued
  2. **Pending Certificates Grid**: Shows students with completed courses who don't have certificates yet

- **Features**:
  - Filters by course
  - Search functionality
  - Real-time list updates
  - One-click certificate generation
  - Loading states and error handling
  - Toast notifications for user feedback

- **Functions**:
  - `fetchData()`: Retrieves issued certificates and completed enrollments
  - `handleGenerateCertificate()`: Issues a certificate to a student

#### Updated: `frontend/src/pages/Admin/Certificates/AdminCertificates.css`
- **New Styles**:
  - `.section-title`: Styled section headers
  - `.pending-certificates-section`: Container for pending certificates
  - `.pending-certificates-grid`: Responsive grid layout
  - `.pending-cert-card`: Individual certificate card
  - `.card-header`: Gradient header with student name
  - `.card-content`: Course and completion info
  - `.card-actions`: Action buttons
  - `.btn-issue`: Green button for issuing certificates
  - `.loading-text`: Loading state messaging

- **Responsive**: Grid adjusts to single column on mobile

## How It Works

### For Students:
1. Student enrolls in a course
2. Student completes all lessons and quizzes in the course
3. Enrollment status automatically changes to `Completed`
4. Student becomes eligible for certification

### For Admins:
1. Admin navigates to Certificates page
2. Sees "Issued Certificates" table - all certificates already given
3. Sees "Pending - Students Ready for Certification" section with cards for each eligible student
4. Clicks "Issue Certificate" button on a student's card
5. System generates PDF and creates certificate record
6. Certificate appears in the Issued Certificates table
7. Student can download/verify the certificate

## Verification
Each certificate includes:
- **Verification Code**: Unique code (e.g., `CERT-A1B2C3D4`)
- **Student Name**: Personalized with full name
- **Course Name**: The completed course title
- **Completion Date**: When the student completed the course
- **Instructor Name**: The course instructor
- **Congratulations Message**: Acknowledgment of achievement

## API Endpoints

### Get All Certificates
```
GET /api/certificates
Response: Array of CertificateResponseDto
```

### Get Completed Enrollments (Eligible for Certification)
```
GET /api/certificates/completed-enrollments
Response: Array of { Id, UserId, StudentName, CourseId, CourseName, CompletedAt }
```

### Generate Certificate for Student
```
POST /api/certificates/generate
Request: { userId, courseId }
Response: { message, certificateId, verificationCode, studentName, courseName }
```

## Database Changes
No schema changes required. Uses existing:
- `Enrollments` table (to check completion status)
- `Certificates` table (to store issued certificates)
- `Users` table (for student/instructor info)
- `Courses` table (for course info)

## Error Handling
- Cannot issue certificate if enrollment is not `Completed`
- Cannot issue duplicate certificates
- Validates student and course existence
- User-friendly error messages in toast notifications

## Future Enhancements
- Certificate download endpoint to serve PDF files
- Email notification when certificate is issued
- Bulk certificate generation
- Certificate revocation
- Analytics on certification rates
