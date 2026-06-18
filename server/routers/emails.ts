import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { emailAccounts } from "../../drizzle/schema";
import { sanitizeInput, isValidEmail } from "../_core/antiScraping";
import { TRPCError } from "@trpc/server";

export const emailsRouter = router({
  /**
   * Generate email account baru
   */
  generate: protectedProcedure
    .input(
      z.object({
        email: z.string().email("Email tidak valid"),
        password: z.string().min(8, "Password minimal 8 karakter"),
        provider: z.enum(["gmail", "outlook", "yahoo"]),
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

      // Validate email format
      if (!isValidEmail(input.email)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Format email tidak valid",
        });
      }

      // Check if email already exists
      const existing = await db
        .select()
        .from(emailAccounts)
        .where(eq(emailAccounts.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email sudah terdaftar",
        });
      }

      // Create email account
      const result = await db.insert(emailAccounts).values({
        userId: ctx.user.id,
        email: sanitizeInput(input.email),
        password: input.password, // In production, encrypt this
        provider: input.provider,
        status: "pending",
      });

      return {
        success: true,
        emailId: result[0],
        message: "Email berhasil dibuat, menunggu verifikasi",
      };
    }),

  /**
   * Get semua email accounts user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const accounts = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, ctx.user.id));

    return accounts.map((acc) => ({
      id: acc.id,
      email: acc.email,
      provider: acc.provider,
      status: acc.status,
      createdAt: acc.createdAt,
    }));
  }),

  /**
   * Get detail email account
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const account = await db
        .select()
        .from(emailAccounts)
        .where(eq(emailAccounts.id, input.id))
        .limit(1);

      if (account.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email tidak ditemukan",
        });
      }

      const acc = account[0];

      // Check ownership
      if (acc.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak memiliki akses ke email ini",
        });
      }

      return {
        id: acc.id,
        email: acc.email,
        provider: acc.provider,
        status: acc.status,
        createdAt: acc.createdAt,
      };
    }),
});
