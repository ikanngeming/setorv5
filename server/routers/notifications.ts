import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { notifications, broadcasts, users } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const notificationsRouter = router({
  /**
   * Get notifications for current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ctx.user.id));

    return notifs.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      type: n.type,
      isRead: n.isRead === 1,
      createdAt: n.createdAt,
    }));
  }),

  /**
   * Get unread notifications count
   */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return 0;

    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, 0)));

    return result.length;
  }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database tidak tersedia",
        });
      }

      // Check ownership
      const notif = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, input.notificationId))
        .limit(1);

      if (notif.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notifikasi tidak ditemukan",
        });
      }

      if (notif[0].userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak memiliki akses ke notifikasi ini",
        });
      }

      // Mark as read
      await db
        .update(notifications)
        .set({ isRead: 1, readAt: new Date() })
        .where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Create broadcast (admin only)
   */
  createBroadcast: adminProcedure
    .input(
      z.object({
        title: z.string().min(3, "Judul minimal 3 karakter"),
        content: z.string().min(10, "Konten minimal 10 karakter"),
        targetRole: z.enum(["all", "user", "admin"]).default("all"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database tidak tersedia",
        });
      }

      // Create broadcast
      const result = await db.insert(broadcasts).values({
        createdBy: ctx.user.id,
        title: input.title,
        content: input.content,
        targetRole: input.targetRole,
        status: "draft",
      });

      return {
        success: true,
        broadcastId: result[0],
        message: "Broadcast berhasil dibuat",
      };
    }),

  /**
   * Publish broadcast (admin only)
   */
  publishBroadcast: adminProcedure
    .input(z.object({ broadcastId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database tidak tersedia",
        });
      }

      // Get broadcast
      const broadcast = await db
        .select()
        .from(broadcasts)
        .where(eq(broadcasts.id, input.broadcastId))
        .limit(1);

      if (broadcast.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Broadcast tidak ditemukan",
        });
      }

      const bc = broadcast[0];

      // Update broadcast status
      await db
        .update(broadcasts)
        .set({
          status: "published",
          publishedAt: new Date(),
        })
        .where(eq(broadcasts.id, input.broadcastId));

      // Get target users based on role
      let targetUsers = await db.select().from(users);

      if (bc.targetRole !== "all") {
        targetUsers = targetUsers.filter((u) => u.role === bc.targetRole);
      }

      // Create notifications for all target users
      for (const user of targetUsers) {
        await db.insert(notifications).values({
          userId: user.id,
          broadcastId: input.broadcastId,
          title: bc.title,
          content: bc.content,
          type: "broadcast",
        });
      }

      return {
        success: true,
        message: `Broadcast berhasil dipublikasikan ke ${targetUsers.length} pengguna`,
      };
    }),

  /**
   * Get broadcasts (public)
   */
  getBroadcasts: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const bcs = await db
      .select()
      .from(broadcasts)
      .where(eq(broadcasts.status, "published"));

    return bcs.map((b) => ({
      id: b.id,
      title: b.title,
      content: b.content,
      publishedAt: b.publishedAt,
    }));
  }),
});
