# Online Learning Platform

A full-stack e-learning platform with role-based dashboards, course management, lessons, quizzes, certificates, progress tracking, real-time chat, analytics, and an AI assistant.

## Features

- Public course browsing, registration, login, and two-factor authentication.
- Student dashboard for enrolled courses, lesson progress, quizzes, certificates, and settings.
- Instructor tools for courses, lessons, quizzes, analytics, and student management.
- Admin tools for users, courses, lessons, quizzes, certificates, analytics, settings, and activity logs.
- SignalR chat for real-time messaging.
- Certificate generation with verification codes.
- AI chatbot backed by a platform knowledge base.
- Audit logging and centralized backend error handling.

## Tech Stack

- Frontend: React, React Router, Axios, Chart.js, SignalR client.
- Backend: ASP.NET Core 8 Web API, Entity Framework Core, SQL Server, JWT authentication, SignalR, QuestPDF.
- AI: Gemini API integration with a local platform knowledge base.
- Tooling: Swagger/OpenAPI, npm, .NET CLI.

## Project Structure

```text
.
+-- backend/        # ASP.NET Core API, EF Core models, migrations, services, SignalR hub
+-- frontend/       # React application and reusable UI components
+-- ids.slnx        # Solution file
`-- README.md
```

## Getting Started

### Prerequisites

- .NET 8 SDK
- Node.js 20 or newer
- SQL Server LocalDB or SQL Server

### Backend

```bash
cd backend
dotnet restore
dotnet ef database update
dotnet run
```

The backend runs on `http://localhost:5000` and exposes Swagger in development mode.

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend runs on `http://localhost:3000`.

## Configuration

Keep secrets out of Git. Use environment variables, user secrets, or a local-only settings file for production credentials.

Useful configuration keys:

```text
ConnectionStrings__DefaultConnection
Jwt__Key
GEMINI_API_KEY
Smtp__Host
Smtp__Port
Smtp__Username
Smtp__Password
Smtp__FromEmail
Smtp__FromName
```

## Verification

```bash
cd backend
dotnet build

cd ../frontend
npm test -- --watchAll=false
npm run build
```

## Portfolio Notes

This repository is best presented as a full-stack capstone project: it shows backend APIs, database modeling, authentication, role-based workflows, real-time chat, reporting, and a React dashboard interface in one product.
