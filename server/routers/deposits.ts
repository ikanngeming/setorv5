import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { depositHistory, users } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const depositsRouter = router({
  /**
   * Create deposit request
   */
  create: protectedProcedure
    .input(
      z.object({
        emailAccountId: z.number().optional(),
        amount: z.number().min(10000, "Minimum deposit Rp 10.000"),
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

      // Create deposit request
      const result = await db.insert(depositHistory).values({
        userId: ctx.user.id,
        emailAccountId: input.emailAccountId,
        amount: input.amount,
        status: "pending",
      });

      return {
        success: true,
        depositId: result[0],
        message: "Permintaan setor berhasil dibuat, menunggu approval admin",
      };
    }),

  /**
   * Get deposit history user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const deposits = await db
      .select()
      .from(depositHistory)
      .where(eq(depositHistory.userId, ctx.user.id));

    return deposits.map((d) => ({
      id: d.id,
      amount: d.amount,
      status: d.status,
      createdAt: d.createdAt,
      approvedAt: d.approvedAt,
    }));
  }),

  /**
   * Get all pending deposits (admin only)
   */
  getPending: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const deposits = await db
      .select()
      .from(depositHistory)
      .where(eq(depositHistory.status, "pending"));

    return deposits;
  }),

  /**
   * Approve deposit (admin only)
   */
  approve: adminProcedure
    .input(z.object({ depositId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database tidak tersedia",
        });
      }

      // Get deposit
      const deposit = await db
        .select()
        .from(depositHistory)
        .where(eq(depositHistory.id, input.depositId))
        .limit(1);

      if (deposit.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deposit tidak ditemukan",
        });
      }

      const dep = deposit[0];

      // Update deposit status
      await db
        .update(depositHistory)
        .set({
          status: "approved",
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
        })
        .where(eq(depositHistory.id, input.depositId));

      // Update user balance
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, dep.userId))
        .limit(1);

      if (user.length > 0) {
        const newBalance = (user[0].balance || 0) + dep.amount;
        await db
          .update(users)
          .set({ balance: newBalance })
          .where(eq(users.id, dep.userId));
      }

      return {
        success: true,
        message: "Deposit berhasil di-approve",
      };
    }),

  /**
   * Reject deposit (admin only)
   */
  reject: adminProcedure
    .input(
      z.object({
        depositId: z.number(),
        reason: z.string().min(5, "Alasan minimal 5 karakter"),
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

      // Update deposit status
      await db
        .update(depositHistory)
        .set({
          status: "rejected",
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          rejectionReason: input.reason,
        })
        .where(eq(depositHistory.id, input.depositId));

      return {
        success: true,
        message: "Deposit berhasil di-reject",
      };
    }),
});
