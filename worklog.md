---
Task ID: 2
Agent: main
Task: Add login authentication to project management system

Work Log:
- Added `password` field to User model in Prisma schema, pushed to DB
- Created `src/lib/auth.ts` - password hashing (scrypt) + verification + session token generation
- Created `src/app/api/auth/login/route.ts` - login API with email/password validation
- Created `src/app/api/auth/session/route.ts` - session management (create/validate/delete), in-memory token store
- Created `src/components/auth/login-view.tsx` - login page UI with gradient background, error handling
- Updated `src/app/page.tsx` - added auth state management, session check on mount, login/logout handlers, conditional render (login vs app)
- Updated `src/components/layout/app-header.tsx` - shows current user name/role badge + logout button
- Updated `src/components/layout/app-sidebar.tsx` - dynamic user info in footer
- Created `scripts/set-passwords.ts` - set initial passwords for 3 existing users
- Build verified successfully

Stage Summary:
- Login system fully functional with scrypt password hashing
- Default password: xd2025 for all users
- Login credentials:
  - zhangsan@company.com / xd2025 (admin)
  - lisi@company.com / xd2025 (manager)
  - wangwu@company.com / xd2025 (member)
- Session stored via HTTP-only cookie + server-side in-memory store
- 7-day session duration
- All pages behind login wall
