# Setor Email Pro - API Documentation

## Overview

Aplikasi ini menggunakan tRPC untuk API backend dengan proteksi keamanan anti-scraping yang komprehensif.

## Security Features

### 1. Rate Limiting
- **Limit**: 100 requests per minute per IP
- **Response**: 429 Too Many Requests dengan header `X-RateLimit-*`
- **Cleanup**: Otomatis setiap 5 menit

### 2. CSRF Protection
- **Token Endpoint**: `GET /api/csrf-token`
- **Usage**: Kirim token di header `X-CSRF-Token` untuk semua mutation
- **Expiry**: 1 jam per token
- **One-time Use**: Token dihapus setelah digunakan

### 3. User-Agent Filtering
- **Blocked**: bot, crawler, spider, scraper, curl, wget, python, java, node, perl, ruby
- **Response**: 403 Forbidden

### 4. Request Validation
- **Content-Type Check**: Hanya JSON, form-urlencoded, multipart/form-data
- **Origin Check**: Validasi origin header di production
- **Input Sanitization**: Hapus karakter HTML/XML berbahaya

## API Endpoints

### Authentication

#### `auth.me`
- **Type**: Query (Public)
- **Response**: Current user object atau null
- **Usage**: Check login status

#### `auth.logout`
- **Type**: Mutation (Public)
- **Response**: `{ success: true }`
- **Usage**: Logout user

### Emails

#### `emails.generate`
- **Type**: Mutation (Protected)
- **Input**:
  ```ts
  {
    email: string;      // Valid email format
    password: string;   // Min 8 characters
    provider: "gmail" | "outlook" | "yahoo";
  }
  ```
- **Response**: `{ success: true, emailId: number, message: string }`
- **Errors**: CONFLICT (email exists), BAD_REQUEST (invalid format)

#### `emails.list`
- **Type**: Query (Protected)
- **Response**: Array of email accounts
- **Fields**: id, email, provider, status, createdAt

#### `emails.getById`
- **Type**: Query (Protected)
- **Input**: `{ id: number }`
- **Response**: Email account detail
- **Errors**: NOT_FOUND, FORBIDDEN (not owner)

### Deposits

#### `deposits.create`
- **Type**: Mutation (Protected)
- **Input**:
  ```ts
  {
    emailAccountId?: number;
    amount: number;  // Min 10000
  }
  ```
- **Response**: `{ success: true, depositId: number, message: string }`

#### `deposits.list`
- **Type**: Query (Protected)
- **Response**: Array of user's deposits
- **Fields**: id, amount, status, createdAt, approvedAt

#### `deposits.getPending`
- **Type**: Query (Admin Only)
- **Response**: Array of all pending deposits

#### `deposits.approve`
- **Type**: Mutation (Admin Only)
- **Input**: `{ depositId: number }`
- **Response**: `{ success: true, message: string }`
- **Side Effect**: Updates user balance

#### `deposits.reject`
- **Type**: Mutation (Admin Only)
- **Input**:
  ```ts
  {
    depositId: number;
    reason: string;  // Min 5 characters
  }
  ```
- **Response**: `{ success: true, message: string }`

### Notifications

#### `notifications.list`
- **Type**: Query (Protected)
- **Response**: Array of user's notifications
- **Fields**: id, title, content, type, isRead, createdAt

#### `notifications.unreadCount`
- **Type**: Query (Protected)
- **Response**: Number of unread notifications

#### `notifications.markAsRead`
- **Type**: Mutation (Protected)
- **Input**: `{ notificationId: number }`
- **Response**: `{ success: true }`

#### `notifications.createBroadcast`
- **Type**: Mutation (Admin Only)
- **Input**:
  ```ts
  {
    title: string;           // Min 3 characters
    content: string;         // Min 10 characters
    targetRole: "all" | "user" | "admin";
  }
  ```
- **Response**: `{ success: true, broadcastId: number, message: string }`

#### `notifications.publishBroadcast`
- **Type**: Mutation (Admin Only)
- **Input**: `{ broadcastId: number }`
- **Response**: `{ success: true, message: string }`
- **Side Effect**: Creates notifications for all target users

#### `notifications.getBroadcasts`
- **Type**: Query (Protected)
- **Response**: Array of published broadcasts
- **Fields**: id, title, content, publishedAt

### Settings

#### `settings.get`
- **Type**: Query (Protected)
- **Response**: User settings
- **Fields**: id, name, email, balance, status, role, createdAt

#### `settings.updateProfile`
- **Type**: Mutation (Protected)
- **Input**: `{ name?: string }`
- **Response**: `{ success: true, message: string }`

#### `settings.getBalance`
- **Type**: Query (Protected)
- **Response**: User balance (number)

## Frontend Integration

### Getting CSRF Token

```typescript
const response = await fetch('/api/csrf-token');
const { token } = await response.json();
```

### Using tRPC Client

```typescript
import { trpc } from '@/lib/trpc';

// Query
const { data } = trpc.emails.list.useQuery();

// Mutation
const mutation = trpc.emails.generate.useMutation({
  onSuccess: () => {
    toast.success('Email berhasil dibuat');
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

mutation.mutate({
  email: 'user@gmail.com',
  password: 'password123',
  provider: 'gmail',
});
```

## Error Handling

### tRPC Error Codes

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User not authorized (e.g., not admin)
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `BAD_REQUEST`: Invalid input
- `INTERNAL_SERVER_ERROR`: Server error

### Example Error Response

```typescript
{
  code: "CONFLICT",
  message: "Email sudah terdaftar"
}
```

## Rate Limiting Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1718361234567
```

## Best Practices

1. **Always check authentication** before sensitive operations
2. **Validate input** on both client and server
3. **Use optimistic updates** for better UX
4. **Handle errors gracefully** with user-friendly messages
5. **Respect rate limits** and implement exponential backoff
6. **Keep CSRF tokens fresh** by requesting new ones periodically
7. **Log errors** for debugging and monitoring

## Testing

### Test Admin Approval Flow

1. Create deposit request as user
2. Login as admin
3. View pending deposits
4. Approve or reject deposit
5. Check user balance updated

### Test Broadcast System

1. Login as admin
2. Create broadcast
3. Publish broadcast
4. Check notifications for target users
5. Mark notifications as read

## Deployment Notes

- All environment variables are injected automatically
- Database connection is lazy-loaded
- Rate limiting store is in-memory (resets on server restart)
- CSRF tokens are in-memory (resets on server restart)
- For production, consider using Redis for rate limiting and CSRF store
