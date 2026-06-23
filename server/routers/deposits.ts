import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const depositsRouter = router({
  create: protectedProcedure
    .input(z.object({
      amount: z.number().min(10000, "Minimum deposit Rp 10.000"),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createDeposit({ userId: ctx.user.id, amount: input.amount });
      return { success: true, depositId: id, message: "Permintaan setor berhasil dibuat, menunggu approval admin" };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const deposits = await db.getDepositsByUserId(ctx.user.id);
    return deposits.map((d) => ({
      id:         d.id,
      amount:     d.amount,
      status:     d.status,
      createdAt:  new Date(d.createdAt),
      approvedAt: d.approvedAt ? new Date(d.approvedAt) : null,
    }));
  }),

  getPending: adminProcedure.query(async () => {
    const deposits = await db.getPendingDeposits();
    return deposits.map((d) => ({
      id:        d.id,
      userId:    d.userId,
      amount:    d.amount,
      status:    d.status,
      createdAt: new Date(d.createdAt),
    }));
  }),

  approve: adminProcedure
    .input(z.object({ depositId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const deposit = await db.getDepositById(input.depositId);
      if (!deposit) throw new TRPCError({ code: "NOT_FOUND", message: "Deposit tidak ditemukan" });
      if (deposit.status !== "pending")
        throw new TRPCError({ code: "BAD_REQUEST", message: "Deposit sudah diproses" });

      await db.updateDeposit(input.depositId, {
        status:     "approved",
        approvedBy: ctx.user.id,
        approvedAt: new Date().toISOString(),
      });

      // Tambah saldo user
      await db.updateUserBalance(deposit.userId, deposit.amount);

      // Notifikasi ke user
      await db.createNotification({
        userId:      deposit.userId,
        broadcastId: null,
        title:       "Deposit Disetujui ✅",
        content:     `Deposit kamu sebesar Rp ${deposit.amount.toLocaleString("id-ID")} telah disetujui.`,
        type:        "approval",
        isRead:      false,
        readAt:      null,
      });

      return { success: true, message: "Deposit berhasil di-approve" };
    }),

  reject: adminProcedure
    .input(z.object({
      depositId: z.number(),
      reason:    z.string().min(5, "Alasan minimal 5 karakter"),
    }))
    .mutation(async ({ ctx, input }) => {
      const deposit = await db.getDepositById(input.depositId);
      if (!deposit) throw new TRPCError({ code: "NOT_FOUND", message: "Deposit tidak ditemukan" });
      if (deposit.status !== "pending")
        throw new TRPCError({ code: "BAD_REQUEST", message: "Deposit sudah diproses" });

      await db.updateDeposit(input.depositId, {
        status:          "rejected",
        approvedBy:      ctx.user.id,
        approvedAt:      new Date().toISOString(),
        rejectionReason: input.reason,
      });

      // Notifikasi ke user
      await db.createNotification({
        userId:      deposit.userId,
        broadcastId: null,
        title:       "Deposit Ditolak ❌",
        content:     `Deposit kamu sebesar Rp ${deposit.amount.toLocaleString("id-ID")} ditolak. Alasan: ${input.reason}`,
        type:        "approval",
        isRead:      false,
        readAt:      null,
      });

      return { success: true, message: "Deposit berhasil di-reject" };
    }),
});
