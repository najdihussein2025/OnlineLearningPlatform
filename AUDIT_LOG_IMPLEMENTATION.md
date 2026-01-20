# Audit Log System Implementation

## Overview
A comprehensive audit logging system has been implemented to track all activities on the Online Learning Platform, including creation, updates, and deletions of courses, lessons, quizzes, users, and other entities.

## Components

### 1. Database Model - `AuditLog.cs`
Located in: `backend/Models/AuditLog.cs`

**Properties:**
- `Id` (int): Primary key
- `Action` (string): Type of operation - "Create", "Update", or "Delete"
- `EntityType` (string): Type of entity affected - "Quiz", "Course", "Lesson", "User", etc.
- `EntityId` (int): ID of the affected entity
- `EntityName` (string): Name/Title of the affected entity (for display without additional queries)
- `Description` (string): Human-readable description of the action
- `UserId` (int, nullable): ID of the user who performed the action
- `User` (navigation property): Reference to the User who performed the action
- `CreatedAt` (DateTime): Timestamp of the action in UTC

### 2. Data Transfer Object - `AuditLogDto.cs`
Located in: `backend/Data/DTOs/AuditLogDto.cs`

Used for API serialization with these properties:
- Id, Action, EntityType, EntityId, EntityName
- Description, UserId, CreatedAt
- `UserName` (string): Name of the user (computed from User navigation property)

### 3. API Controller - `AuditLogsController.cs`
Located in: `backend/Controllers/AuditLogsController.cs`

**Endpoints:**

#### GET /api/auditlogs
Returns recent audit logs (default limit: 50)
- Query Parameters:
  - `limit` (int, optional): Number of logs to return (default: 50)
- Returns: List of AuditLogDto objects, ordered by CreatedAt descending

#### GET /api/auditlogs/byEntity/{entityType}/{entityId}
Returns audit logs filtered by entity type and ID
- Parameters:
  - `entityType` (string): Type of entity (e.g., "Quiz", "Course")
  - `entityId` (int): ID of the entity
- Returns: List of AuditLogDto objects for that specific entity

#### POST /api/auditlogs/log
Creates a new audit log entry
- Request Body: AuditLog object
- Returns: Newly created AuditLogDto

### 4. Integration Points

#### QuizzesController
- `CreateQuiz`: Logs quiz creation with description like "Quiz 'Title' has been created"
- `UpdateQuiz`: Logs quiz updates with description showing old and new titles
- `DeleteQuiz`: Logs quiz deletion with description like "Quiz 'Title' has been deleted"

#### CoursesController
- `DeleteCourse`: Logs course deletion with user information

#### LessonsController
- `DeleteLesson`: Logs lesson deletion with user information

#### UsersController
- `DeleteUser`: Logs user deletion with user information

### 5. Frontend Integration - `AdminDashboard.js`
Located in: `frontend/src/pages/Admin/Dashboard/AdminDashboard.js`

**Changes:**
- Replaced hardcoded activity generation with real-time API calls
- Now fetches from `/api/auditlogs?limit=10` endpoint
- Displays audit log data with:
  - Action type (Create/Update/Delete)
  - Entity type and description
  - Relative timestamp (using getTimeAgo function)
  - User who performed the action

## Database Migration

Migration file: `backend/Migrations/20260117194523_AddAuditLog.cs`

Creates the `AuditLogs` table with:
- Primary key on `Id`
- Foreign key relationship to `Users` table via `UserId`
- Index on `UserId` for efficient queries

## Usage Examples

### Example 1: Viewing Recent Activities
```javascript
// In AdminDashboard component
const auditLogsRes = await api.get('/auditlogs?limit=10');
const activities = auditLogsRes.data.map(log => ({
  id: `audit-${log.id}`,
  type: log.entityType.toLowerCase(),
  action: `[${log.action}] ${log.entityType}: ${log.description}`,
  time: getTimeAgo(new Date(log.createdAt)),
  user: log.userName || 'System'
}));
```

### Example 2: Viewing Activity for Specific Quiz
```javascript
// Fetch all activities related to a specific quiz
const quizLogsRes = await api.get('/api/auditlogs/byEntity/Quiz/5');
// Shows all create, update, and delete logs for quiz with ID 5
```

### Example 3: Manual Audit Log Creation
```csharp
// In controller method
var auditLog = new AuditLog
{
    Action = "Create",
    EntityType = "Quiz",
    EntityId = quiz.Id,
    EntityName = quiz.Title,
    Description = $"Quiz '{quiz.Title}' has been created",
    UserId = userId,
    CreatedAt = DateTime.UtcNow
};
_context.AuditLogs.Add(auditLog);
await _context.SaveChangesAsync();
```

## Features

✅ **Complete Action Tracking**: Captures Create, Update, and Delete operations
✅ **User Attribution**: Records which user performed each action
✅ **Entity Context**: Stores entity name/title for display without additional queries
✅ **Timestamp Accuracy**: Uses UTC DateTime for consistent tracking
✅ **Query Flexibility**: Filter by recent logs or by specific entity
✅ **Frontend Integration**: Real-time display of all platform activities
✅ **Persistent History**: Actions are never lost, even if entities are deleted
✅ **Cascading Relationships**: Maintains referential integrity with foreign key to Users

## How to Extend

To add audit logging to another controller's delete method:

```csharp
[HttpDelete("{id}")]
public async Task<IActionResult> Delete{Entity}(int id)
{
    var entity = await _context.{Entities}.FindAsync(id);
    if (entity == null) return NotFound();

    // Extract user ID from JWT
    var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
    int? userId = null;
    if (int.TryParse(sub, out var parsedId))
    {
        userId = parsedId;
    }

    // Log the deletion
    var auditLog = new AuditLog
    {
        Action = "Delete",
        EntityType = "{EntityType}",
        EntityId = entity.Id,
        EntityName = entity.{NameProperty},
        Description = $"{EntityType} '{entity.{NameProperty}}' has been deleted",
        UserId = userId,
        CreatedAt = DateTime.UtcNow
    };
    _context.AuditLogs.Add(auditLog);

    _context.{Entities}.Remove(entity);
    await _context.SaveChangesAsync();
    return Ok(new { message = "{EntityType} deleted successfully" });
}
```

## Testing

1. **Start the backend server:**
   ```bash
   cd backend
   dotnet run
   ```

2. **Test delete operations:**
   - Delete a quiz, course, lesson, or user from the admin dashboard
   - Check that the action appears in the Recent Activity section

3. **Test API directly:**
   - GET: `http://localhost:5000/api/auditlogs`
   - GET: `http://localhost:5000/api/auditlogs/byEntity/Quiz/1`

4. **Verify database:**
   - Check the `AuditLogs` table in the database for new entries

## Performance Considerations

- Audit logs are indexed on `UserId` for efficient queries
- Default limit of 50 logs prevents excessive data transfer
- Lazy loading relationships when needed
- Future optimization: Add database-level archiving for old logs (>1 year)

## Security Notes

- Audit logs are created automatically by the backend
- User information is extracted from JWT claims (cannot be spoofed client-side)
- UserId can be NULL for anonymous actions
- All timestamps are in UTC for consistency
