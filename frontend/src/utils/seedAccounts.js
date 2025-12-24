/**
 * Seed utility for creating test accounts
 * This creates 3 test accounts for testing different dashboards
 */

export const seedAccounts = () => {
  const accounts = [
    {
      email: 'student@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Student',
      role: 'student',
    },
    {
      email: 'instructor@test.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Instructor',
      role: 'instructor',
    },
    {
      email: 'admin@test.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  ];

  // Store seeded accounts info (for reference, not for auth)
  localStorage.setItem('seededAccounts', JSON.stringify(accounts));
  
  return accounts;
};

export const getSeededAccounts = () => {
  const accountsStr = localStorage.getItem('seededAccounts');
  return accountsStr ? JSON.parse(accountsStr) : null;
};

export const clearSeededAccounts = () => {
  localStorage.removeItem('seededAccounts');
};

