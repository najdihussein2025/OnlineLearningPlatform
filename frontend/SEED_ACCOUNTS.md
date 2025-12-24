# Test Accounts (Seed Data)

This application includes pre-seeded test accounts for easy testing of different user roles.

## Test Accounts

### Student Account
- **Email:** `student@test.com`
- **Password:** `password123`
- **Role:** Student
- **Dashboard:** `/student/dashboard`

### Instructor Account
- **Email:** `instructor@test.com`
- **Password:** `password123`
- **Role:** Instructor
- **Dashboard:** `/instructor/dashboard`

### Admin Account
- **Email:** `admin@test.com`
- **Password:** `password123`
- **Role:** Admin
- **Dashboard:** `/admin/dashboard`

## How to Use

1. Navigate to the Login page (`/login`)
2. You'll see a "Test Accounts" section with quick login buttons
3. Click on any test account button to automatically log in
4. You'll be redirected to the appropriate dashboard based on the role

## Manual Login

You can also manually enter the credentials:
- Enter the email and password from the test accounts above
- Click "Login"
- You'll be redirected to the role-specific dashboard

## Notes

- These accounts are stored in localStorage for UI testing
- They work without a backend connection
- All accounts use the same password: `password123`
- The accounts are automatically seeded when you visit the login page

