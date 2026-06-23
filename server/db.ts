/**
 * db.ts — JSONBin.io sebagai database JSON
 *
 * Semua operasi: GET (baca semua) → modifikasi in-memory → PUT (tulis semua).
 *
 * JSONBin endpoint:
 *   GET  https://api.jsonbin.io/v3/b/{BIN_ID}/latest
 *   PUT  https://api.jsonbin.io/v3/b/{BIN_ID}
 */

import { ENV } from "./_core/env";
import type { DbSchema, StoredUser, User, EmailAccount, Deposit, Notification, Broadcast } from "./types";
import { EMPTY_DB } from "./types";

const BASE = "https://api.jsonbin.io/v3/b";

// ----------------------------------------------------------------
// Low-level read / write
// ----------------------------------------------------------------

async function readBin(): Promise<DbSchema> {
  if (!ENV.jsonbinApiKey || !ENV.jsonbinBinId) {
    return structuredClone(EMPTY_DB);
  }
  const res = await fetch(`${BASE}/${ENV.jsonbinBinId}/latest`, {
    headers: { "X-Master-Key": ENV.jsonbinApiKey, "X-Bin-Meta": "false" },
  });
  if (!res.ok) throw new Error(`[DB] read failed ${res.status}: ${await res.text()}`);
  return mergeWithEmpty(await res.json() as Partial<DbSchema>);
}

async function writeBin(data: DbSchema): Promise<void> {
  if (!ENV.jsonbinApiKey || !ENV.jsonbinBinId) return;
  const res = await fetch(`${BASE}/${ENV.jsonbinBinId}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Key": ENV.jsonbinApiKey },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`[DB] write failed ${res.status}: ${await res.text()}`);
}

function mergeWithEmpty(data: Partial<DbSchema>): DbSchema {
  return {
    users:         data.users         ?? [],
    emailAccounts: data.emailAccounts ?? [],
    deposits:      data.deposits      ?? [],
    notifications: data.notifications ?? [],
    broadcasts:    data.broadcasts    ?? [],
    _meta: {
      lastId: {
        users:         data._meta?.lastId?.users         ?? 0,
        emailAccounts: data._meta?.lastId?.emailAccounts ?? 0,
        deposits:      data._meta?.lastId?.deposits      ?? 0,
        notifications: data._meta?.lastId?.notifications ?? 0,
        broadcasts:    data._meta?.lastId?.broadcasts    ?? 0,
      },
    },
  };
}

/** Baca → ubah → tulis, return result */
async function tx<T>(fn: (db: DbSchema) => { db: DbSchema; result: T }): Promise<T> {
  const db = await readBin();
  const { db: updated, result } = fn(db);
  await writeBin(updated);
  return result;
}

function nextId(db: DbSchema, t: keyof DbSchema["_meta"]["lastId"]): number {
  return ++db._meta.lastId[t];
}

function now(): string { return new Date().toISOString(); }

function toISO(d: Date | string | undefined | null): string {
  if (!d) return now();
  return d instanceof Date ? d.toISOString() : d;
}

/** Konversi StoredUser → User (untuk SDK compatibility) */
function storedToUser(s: StoredUser): User {
  return {
    ...s,
    createdAt:    new Date(s.createdAt),
    updatedAt:    new Date(s.updatedAt),
    lastSignedIn: new Date(s.lastSignedIn),
  };
}

// ----------------------------------------------------------------
// Users
// ----------------------------------------------------------------

export async function getUserByOpenId(openId: string): Promise<User | null> {
  const db = await readBin();
  const found = db.users.find((u) => u.openId === openId);
  return found ? storedToUser(found) : null;
}

export async function getUserById(id: number): Promise<User | null> {
  const db = await readBin();
  const found = db.users.find((u) => u.id === id);
  return found ? storedToUser(found) : null;
}

export async function getAllUsers(): Promise<User[]> {
  const db = await readBin();
  return db.users.map(storedToUser);
}

export async function upsertUser(
  input: Pick<User, "openId"> & Partial<Omit<User, "id" | "openId">>
): Promise<void> {
  await tx((db) => {
    const idx = db.users.findIndex((u) => u.openId === input.openId);
    const t   = now();

    if (idx >= 0) {
      db.users[idx] = {
        ...db.users[idx],
        name:         input.name         ?? db.users[idx].name,
        email:        input.email        ?? db.users[idx].email,
        loginMethod:  input.loginMethod  ?? db.users[idx].loginMethod,
        lastSignedIn: toISO(input.lastSignedIn as Date | string) ?? db.users[idx].lastSignedIn,
        updatedAt:    t,
      };
    } else {
      const isFirst = db.users.length === 0;
      db.users.push({
        id:           nextId(db, "users"),
        openId:       input.openId,
        name:         input.name         ?? null,
        email:        input.email        ?? null,
        loginMethod:  input.loginMethod  ?? null,
        role:         isFirst ? "admin" : "user",
        status:       "active",
        balance:      0,
        createdAt:    t,
        updatedAt:    t,
        lastSignedIn: toISO(input.lastSignedIn as Date | string),
      });
    }
    return { db, result: undefined };
  });
}

export async function updateUser(
  userId: number,
  data: Partial<Pick<StoredUser, "name" | "role" | "status" | "balance">>
): Promise<void> {
  await tx((db) => {
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx >= 0) Object.assign(db.users[idx], { ...data, updatedAt: now() });
    return { db, result: undefined };
  });
}

export async function updateUserBalance(userId: number, delta: number): Promise<void> {
  await tx((db) => {
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx >= 0) { db.users[idx].balance += delta; db.users[idx].updatedAt = now(); }
    return { db, result: undefined };
  });
}

// ----------------------------------------------------------------
// Email Accounts
// ----------------------------------------------------------------

export async function getEmailsByUserId(userId: number): Promise<EmailAccount[]> {
  const db = await readBin();
  return db.emailAccounts.filter((e) => e.userId === userId);
}

export async function getEmailById(id: number): Promise<EmailAccount | null> {
  const db = await readBin();
  return db.emailAccounts.find((e) => e.id === id) ?? null;
}

export async function getEmailByAddress(email: string): Promise<EmailAccount | null> {
  const db = await readBin();
  return db.emailAccounts.find((e) => e.email === email) ?? null;
}

export async function createEmail(
  input: Omit<EmailAccount, "id" | "createdAt" | "updatedAt">
): Promise<number> {
  return tx((db) => {
    const id = nextId(db, "emailAccounts");
    const t  = now();
    db.emailAccounts.push({ ...input, id, createdAt: t, updatedAt: t });
    return { db, result: id };
  });
}

export async function updateEmailStatus(id: number, status: EmailAccount["status"]): Promise<void> {
  await tx((db) => {
    const idx = db.emailAccounts.findIndex((e) => e.id === id);
    if (idx >= 0) { db.emailAccounts[idx].status = status; db.emailAccounts[idx].updatedAt = now(); }
    return { db, result: undefined };
  });
}

// ----------------------------------------------------------------
// Deposits
// ----------------------------------------------------------------

export async function getDepositsByUserId(userId: number): Promise<Deposit[]> {
  const db = await readBin();
  return db.deposits.filter((d) => d.userId === userId);
}

export async function getPendingDeposits(): Promise<Deposit[]> {
  const db = await readBin();
  return db.deposits.filter((d) => d.status === "pending");
}

export async function getDepositById(id: number): Promise<Deposit | null> {
  const db = await readBin();
  return db.deposits.find((d) => d.id === id) ?? null;
}

export async function createDeposit(input: Pick<Deposit, "userId" | "amount">): Promise<number> {
  return tx((db) => {
    const id = nextId(db, "deposits");
    const t  = now();
    db.deposits.push({
      id, ...input, status: "pending",
      approvedBy: null, approvedAt: null, rejectionReason: null,
      createdAt: t, updatedAt: t,
    });
    return { db, result: id };
  });
}

export async function updateDeposit(
  id: number,
  data: Partial<Pick<Deposit, "status" | "approvedBy" | "approvedAt" | "rejectionReason">>
): Promise<void> {
  await tx((db) => {
    const idx = db.deposits.findIndex((d) => d.id === id);
    if (idx >= 0) Object.assign(db.deposits[idx], { ...data, updatedAt: now() });
    return { db, result: undefined };
  });
}

// ----------------------------------------------------------------
// Notifications
// ----------------------------------------------------------------

export async function getNotificationsByUserId(userId: number): Promise<Notification[]> {
  const db = await readBin();
  return db.notifications.filter((n) => n.userId === userId);
}

export async function getNotificationById(id: number): Promise<Notification | null> {
  const db = await readBin();
  return db.notifications.find((n) => n.id === id) ?? null;
}

export async function createNotification(
  input: Omit<Notification, "id" | "createdAt">
): Promise<number> {
  return tx((db) => {
    const id = nextId(db, "notifications");
    db.notifications.push({ ...input, id, createdAt: now() });
    return { db, result: id };
  });
}

export async function createNotificationsBulk(
  inputs: Omit<Notification, "id" | "createdAt">[]
): Promise<void> {
  if (!inputs.length) return;
  await tx((db) => {
    const t = now();
    for (const input of inputs) {
      db.notifications.push({ ...input, id: nextId(db, "notifications"), createdAt: t });
    }
    return { db, result: undefined };
  });
}

export async function markNotificationRead(id: number): Promise<void> {
  await tx((db) => {
    const idx = db.notifications.findIndex((n) => n.id === id);
    if (idx >= 0) { db.notifications[idx].isRead = true; db.notifications[idx].readAt = now(); }
    return { db, result: undefined };
  });
}

// ----------------------------------------------------------------
// Broadcasts
// ----------------------------------------------------------------

export async function createBroadcast(
  input: Omit<Broadcast, "id" | "createdAt" | "updatedAt">
): Promise<number> {
  return tx((db) => {
    const id = nextId(db, "broadcasts");
    const t  = now();
    db.broadcasts.push({ ...input, id, createdAt: t, updatedAt: t });
    return { db, result: id };
  });
}

export async function getBroadcastById(id: number): Promise<Broadcast | null> {
  const db = await readBin();
  return db.broadcasts.find((b) => b.id === id) ?? null;
}

export async function getPublishedBroadcasts(): Promise<Broadcast[]> {
  const db = await readBin();
  return db.broadcasts.filter((b) => b.status === "published");
}

export async function updateBroadcast(
  id: number,
  data: Partial<Pick<Broadcast, "status" | "publishedAt">>
): Promise<void> {
  await tx((db) => {
    const idx = db.broadcasts.findIndex((b) => b.id === id);
    if (idx >= 0) Object.assign(db.broadcasts[idx], { ...data, updatedAt: now() });
    return { db, result: undefined };
  });
}
