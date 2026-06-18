# Setor Email Pro - Setup & Features Guide

## 🚀 Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm check
```

### Build & Deploy

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 📋 Features

### User Features

#### 1. **Dashboard**
- View account statistics (saldo, total email, pending, approved)
- Quick action buttons to navigate to main features
- Recent deposit history
- Welcome message with user name

#### 2. **Generate Email**
- Create new email accounts
- Support for Gmail, Outlook, Yahoo
- Password validation (min 8 characters)
- Email format validation
- Status tracking (pending, verified, rejected, expired)

#### 3. **Setor (Deposit)**
- Create deposit requests
- Minimum deposit: Rp 10.000
- Optional email account selection
- Real-time status updates
- Waiting for admin approval

#### 4. **Riwayat (History)**
- View all deposit history with status
- View all email accounts created
- Tabbed interface for easy navigation
- Detailed timestamps

#### 5. **Settings**
- Update profile name
- View account information
- Check account status
- Logout functionality

### Admin Features

#### 1. **Admin Panel** (Role: admin)
- **Deposit Approval**
  - View all pending deposits
  - Approve deposits (auto-update user balance)
  - Reject deposits with reason
  - Real-time table updates

- **Broadcast System**
  - Create broadcast messages
  - Target specific roles (all, user, admin)
  - Publish broadcasts
  - View published broadcasts
  - Auto-create notifications for target users

### Security Features

#### 1. **Rate Limiting**
- 100 requests per minute per IP
- Automatic cleanup every 5 minutes
- Returns 429 Too Many Requests when exceeded

#### 2. **CSRF Protection**
- Token-based protection
- 1-hour token expiry
- One-time use tokens
- Endpoint: `GET /api/csrf-token`

#### 3. **User-Agent Filtering**
- Blocks common scrapers (bot, crawler, spider, etc.)
- Blocks programming language clients (curl, wget, python, java, node, etc.)
- Returns 403 Forbidden

#### 4. **Request Validation**
- Content-Type validation
- Origin header validation (production)
- Input sanitization (removes HTML/XML chars)
- Email format validation

#### 5. **Authentication**
- Manus OAuth integration
- Role-based access control (user, admin)
- Protected routes
- Session management

## 🗄️ Database Schema

### Users Table
- id (PK)
- openId (unique)
- name
- email
- loginMethod
- role (user, admin)
- balance
- status (active, suspended, banned)
- createdAt, updatedAt, lastSignedIn

### Email Accounts Table
- id (PK)
- userId (FK)
- email (unique)
- password (encrypted)
- provider (gmail, outlook, yahoo)
- status (pending, verified, rejected, expired)
- verificationCode
- createdAt, updatedAt

### Deposit History Table
- id (PK)
- userId (FK)
- emailAccountId (FK, optional)
- amount
- status (pending, approved, rejected)
- approvedBy (FK, admin)
- approvedAt
- rejectionReason
- createdAt, updatedAt

### Broadcasts Table
- id (PK)
- createdBy (FK, admin)
- title
- content
- targetRole (all, user, admin)
- status (draft, published, archived)
- publishedAt
- createdAt, updatedAt

### Notifications Table
- id (PK)
- userId (FK)
- broadcastId (FK, optional)
- title
- content
- type (broadcast, approval, system)
- isRead (0, 1)
- readAt
- createdAt

## 🔐 API Endpoints

### Public Endpoints
- `GET /api/csrf-token` - Get CSRF token

### Protected Endpoints (Require Authentication)

#### Emails
- `emails.generate` - Create new email account
- `emails.list` - Get user's email accounts
- `emails.getById` - Get specific email account

#### Deposits
- `deposits.create` - Create deposit request
- `deposits.list` - Get user's deposit history
- `deposits.getPending` - Get all pending (admin only)
- `deposits.approve` - Approve deposit (admin only)
- `deposits.reject` - Reject deposit (admin only)

#### Notifications
- `notifications.list` - Get user's notifications
- `notifications.unreadCount` - Get unread count
- `notifications.markAsRead` - Mark as read
- `notifications.createBroadcast` - Create broadcast (admin only)
- `notifications.publishBroadcast` - Publish broadcast (admin only)
- `notifications.getBroadcasts` - Get published broadcasts

#### Settings
- `settings.get` - Get user settings
- `settings.updateProfile` - Update profile
- `settings.getBalance` - Get user balance

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach
- Sidebar navigation on desktop
- Bottom navigation on mobile
- Adaptive layouts

### Components
- Modern card-based layouts
- Status badges with color coding
- Loading states with spinners
- Toast notifications for feedback
- Dropdown menus for actions
- Tabs for organized content
- Tables for data display

### Navigation
- Persistent sidebar with collapsible menu
- Quick action buttons
- Breadcrumb-like page titles
- Notification button with badge

## 📊 User Flows

### Deposit Workflow
1. User creates email account via Generate Email
2. User creates deposit request via Setor
3. Admin reviews pending deposits in Admin Panel
4. Admin approves/rejects deposit
5. If approved, user's balance increases
6. User sees updated balance in Dashboard

### Broadcast Workflow
1. Admin creates broadcast in Admin Panel
2. Admin publishes broadcast
3. System creates notifications for target users
4. Users see notifications in Notification dropdown
5. Users can mark notifications as read

## 🔧 Configuration

### Environment Variables (Auto-injected)
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session signing secret
- `VITE_APP_ID` - Manus OAuth app ID
- `OAUTH_SERVER_URL` - Manus OAuth server
- `VITE_OAUTH_PORTAL_URL` - Manus login portal
- `OWNER_OPEN_ID` - Owner's OpenID
- `OWNER_NAME` - Owner's name
- `BUILT_IN_FORGE_API_URL` - Manus API URL
- `BUILT_IN_FORGE_API_KEY` - Manus API key
- `VITE_FRONTEND_FORGE_API_URL` - Frontend Manus API URL
- `VITE_FRONTEND_FORGE_API_KEY` - Frontend Manus API key

## 📝 Development Guidelines

### Adding New Features
1. Update database schema in `drizzle/schema.ts`
2. Generate migration: `pnpm drizzle-kit generate`
3. Apply migration via `webdev_execute_sql`
4. Add query helpers in `server/db.ts`
5. Create tRPC router in `server/routers/`
6. Register router in `server/routers.ts`
7. Create frontend pages/components
8. Update routing in `client/src/App.tsx`
9. Write tests in `server/*.test.ts`

### Code Style
- Use TypeScript for type safety
- Follow existing naming conventions
- Use shadcn/ui components for UI
- Keep components under 300 lines
- Extract reusable logic into utilities

### Testing
- Write vitest tests for critical logic
- Test error cases and edge cases
- Mock database calls
- Test API endpoints

## 🚨 Common Issues

### Issue: Rate limit exceeded
**Solution**: Wait for the rate limit window to reset (1 minute) or implement exponential backoff

### Issue: CSRF token invalid
**Solution**: Request a new CSRF token from `/api/csrf-token` endpoint

### Issue: User-agent blocked
**Solution**: Use a real browser or add custom User-Agent header

### Issue: Database connection failed
**Solution**: Check `DATABASE_URL` environment variable and database server status

## 📚 Additional Resources

- See `API_DOCUMENTATION.md` for detailed API reference
- Check `server/_core/antiScraping.ts` for security implementation
- Review `drizzle/schema.ts` for database structure
- Explore `server/routers/` for API implementations

## 🤝 Support

For issues or questions:
1. Check the documentation files
2. Review error messages in dev console
3. Check server logs in `.manus-logs/`
4. Review TypeScript errors with `pnpm check`

## 📄 License

This project is part of Setor Email Pro system.
