import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const notifs = await db.getNotificationsByUserId(ctx.user.id);
    return notifs.map((n) => ({
      id:        n.id,
      title:     n.title,
      content:   n.content,
      type:      n.type,
      isRead:    n.isRead,
      createdAt: new Date(n.createdAt),
    }));
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const notifs = await db.getNotificationsByUserId(ctx.user.id);
    return notifs.filter((n) => !n.isRead).length;
  }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const notif = await db.getNotificationById(input.notificationId);
      if (!notif) throw new TRPCError({ code: "NOT_FOUND", message: "Notifikasi tidak ditemukan" });
      if (notif.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Akses ditolak" });
      await db.markNotificationRead(input.notificationId);
      return { success: true };
    }),

  // Buat broadcast DAN langsung kirim ke semua target dalam satu mutation
  createBroadcast: adminProcedure
    .input(z.object({
      title:      z.string().min(3, "Judul minimal 3 karakter"),
      content:    z.string().min(10, "Konten minimal 10 karakter"),
      targetRole: z.enum(["all", "user", "admin"]).default("all"),
    }))
    .mutation(async ({ ctx, input }) => {
      const t = new Date().toISOString();

      // Buat broadcast record
      const broadcastId = await db.createBroadcast({
        createdBy:   ctx.user.id,
        title:       input.title,
        content:     input.content,
        targetRole:  input.targetRole,
        status:      "published",
        publishedAt: t,
      });

      // Kirim notifikasi ke semua target
      const allUsers = await db.getAllUsers();
      const targets  = input.targetRole === "all"
        ? allUsers
        : allUsers.filter((u) => u.role === input.targetRole);

      await db.createNotificationsBulk(
        targets.map((u) => ({
          userId:      u.id,
          broadcastId,
          title:       input.title,
          content:     input.content,
          type:        "broadcast" as const,
          isRead:      false,
          readAt:      null,
        }))
      );

      return {
        success: true,
        broadcastId,
        message: `Broadcast berhasil dikirim ke ${targets.length} pengguna`,
      };
    }),

  getBroadcasts: protectedProcedure.query(async () => {
    const bcs = await db.getPublishedBroadcasts();
    return bcs.map((b) => ({
      id:          b.id,
      title:       b.title,
      content:     b.content,
      publishedAt: b.publishedAt ? new Date(b.publishedAt) : null,
    }));
  }),
});
