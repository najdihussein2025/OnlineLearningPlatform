-- Run this script against your database to create Conversations and Messages tables.
-- Use: sqlcmd -S "(localdb)\MSSQLLocalDB" -d OnlineLearningPlatform -i "Scripts\Apply-RefactorChatToConversations.sql"
-- Or open in SSMS and execute against OnlineLearningPlatform.

USE [OnlineLearningPlatform];
GO

-- 1. Create Conversations table (skip if already exists)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Conversations')
BEGIN
    CREATE TABLE [dbo].[Conversations] (
        [Id] int NOT NULL IDENTITY(1,1),
        [StudentId] int NOT NULL,
        [InstructorId] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Conversations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Conversations_Users_StudentId] FOREIGN KEY ([StudentId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Conversations_Users_InstructorId] FOREIGN KEY ([InstructorId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
    CREATE INDEX [IX_Conversations_InstructorId] ON [Conversations] ([InstructorId]);
    CREATE UNIQUE INDEX [IX_Conversations_StudentId_InstructorId] ON [Conversations] ([StudentId], [InstructorId]);
    PRINT 'Created table Conversations';
END
ELSE
    PRINT 'Table Conversations already exists';
GO

-- 2. Create Messages table (skip if already exists)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Messages')
BEGIN
    CREATE TABLE [dbo].[Messages] (
        [Id] int NOT NULL IDENTITY(1,1),
        [ConversationId] int NOT NULL,
        [SenderId] int NOT NULL,
        [Content] nvarchar(max) NOT NULL,
        [SentAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Messages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Messages_Conversations_ConversationId] FOREIGN KEY ([ConversationId]) REFERENCES [Conversations] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Messages_Users_SenderId] FOREIGN KEY ([SenderId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
    CREATE INDEX [IX_Messages_ConversationId] ON [Messages] ([ConversationId]);
    CREATE INDEX [IX_Messages_SenderId] ON [Messages] ([SenderId]);
    PRINT 'Created table Messages';
END
ELSE
    PRINT 'Table Messages already exists';
GO

-- 3. If ChatMessages exists, migrate data then drop it
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatMessages')
BEGIN
    -- Migrate into Conversations (distinct student-instructor pairs)
    INSERT INTO [Conversations] ([StudentId], [InstructorId], [CreatedAt])
    SELECT DISTINCT 
        CASE WHEN cm.SenderId = c.CreatedBy THEN cm.ReceiverId ELSE cm.SenderId END,
        c.CreatedBy,
        ISNULL(MIN(cm.SentAt), GETUTCDATE())
    FROM [ChatMessages] cm
    INNER JOIN [Courses] c ON c.Id = cm.CourseId
    GROUP BY 
        CASE WHEN cm.SenderId = c.CreatedBy THEN cm.ReceiverId ELSE cm.SenderId END, 
        c.CreatedBy;

    -- Migrate into Messages
    INSERT INTO [Messages] ([ConversationId], [SenderId], [Content], [SentAt])
    SELECT conv.Id, cm.SenderId, cm.Message, cm.SentAt
    FROM [ChatMessages] cm
    INNER JOIN [Courses] c ON c.Id = cm.CourseId
    INNER JOIN [Conversations] conv 
        ON conv.StudentId = (CASE WHEN cm.SenderId = c.CreatedBy THEN cm.ReceiverId ELSE cm.SenderId END) 
        AND conv.InstructorId = c.CreatedBy;

    DROP TABLE [ChatMessages];
    PRINT 'Migrated ChatMessages into Conversations/Messages and dropped ChatMessages';
END
GO

-- 4. Record migration in EF history (so "dotnet ef database update" won't try to run it again)
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260126000000_RefactorChatToConversations')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES (N'20260126000000_RefactorChatToConversations', N'8.0.0');
GO

PRINT 'Done. Conversations and Messages are ready.';
