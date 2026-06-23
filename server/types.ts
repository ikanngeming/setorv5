// ============================================================
// Tipe data aplikasi — pengganti Drizzle schema
// ============================================================

export type UserRole   = "user" | "admin";
export type UserStatus = "active" | "suspended" | "banned";

export type User = {
  id:           number;
  openId:       string;
  name:         string | null;
  email:        string | null;
  loginMethod:  string | null;
  role:         UserRole;
  status?:      UserStatus;
  balance?:     number;
  createdAt:    Date | string;
  updatedAt:    Date | string;
  lastSignedIn: Date | string;
};

export type EmailStatus   = "pending" | "verified" | "rejected" | "expired";
export type EmailProvider = "gmail" | "outlook" | "yahoo";

export type EmailAccount = {
  id:        number;
  userId:    number;
  email:     string;
  password:  string;
  provider:  EmailProvider;
  status:    EmailStatus;
  createdAt: string;
  updatedAt: string;
};

export type DepositStatus = "pending" | "approved" | "rejected";

export type Deposit = {
  id:              number;
  userId:          number;
  amount:          number;
  status:          DepositStatus;
  approvedBy:      number | null;
  approvedAt:      string | null;
  rejectionReason: string | null;
  createdAt:       string;
  updatedAt:       string;
};

export type NotifType = "broadcast" | "approval" | "system";

export type Notification = {
  id:          number;
  userId:      number;
  broadcastId: number | null;
  title:       string;
  content:     string;
  type:        NotifType;
  isRead:      boolean;
  readAt:      string | null;
  createdAt:   string;
};

export type BroadcastStatus = "draft" | "published" | "archived";
export type BroadcastTarget = "all" | "user" | "admin";

export type Broadcast = {
  id:          number;
  createdBy:   number;
  title:       string;
  content:     string;
  targetRole:  BroadcastTarget;
  status:      BroadcastStatus;
  publishedAt: string | null;
  createdAt:   string;
  updatedAt:   string;
};

// Struktur JSON yang disimpan di JSONBin
export type StoredUser = {
  id:           number;
  openId:       string;
  name:         string | null;
  email:        string | null;
  loginMethod:  string | null;
  role:         UserRole;
  status:       UserStatus;
  balance:      number;
  createdAt:    string;
  updatedAt:    string;
  lastSignedIn: string;
};

export type DbSchema = {
  users:         StoredUser[];
  emailAccounts: EmailAccount[];
  deposits:      Deposit[];
  notifications: Notification[];
  broadcasts:    Broadcast[];
  _meta: {
    lastId: {
      users:         number;
      emailAccounts: number;
      deposits:      number;
      notifications: number;
      broadcasts:    number;
    };
  };
};

export const EMPTY_DB: DbSchema = {
  users:         [],
  emailAccounts: [],
  deposits:      [],
  notifications: [],
  broadcasts:    [],
  _meta: {
    lastId: {
      users:         0,
      emailAccounts: 0,
      deposits:      0,
      notifications: 0,
      broadcasts:    0,
    },
  },
};
