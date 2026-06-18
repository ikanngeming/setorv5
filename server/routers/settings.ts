import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { sanitizeInput } from "../_core/antiScraping";

export const settingsRouter = router({
  /**
   * Get user settings
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (user.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User tidak ditemukan",
      });
    }

    const u = user[0];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      balance: u.balance,
      status: u.status,
      role: u.role,
      createdAt: u.createdAt,
    };
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, "Nama minimal 2 karakter").optional(),
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

      const updateData: Record<string, unknown> = {};

      if (input.name) {
        updateData.name = sanitizeInput(input.name);
      }

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: "Profil berhasil diperbarui",
      };
    }),

  /**
   * Get user balance
   */
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return 0;

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    return user.length > 0 ? user[0].balance || 0 : 0;
  }),
});
