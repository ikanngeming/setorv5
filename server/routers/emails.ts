import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const emailsRouter = router({
  generate: protectedProcedure
    .input(z.object({
      email:    z.string().email("Email tidak valid"),
      password: z.string().min(8, "Password minimal 8 karakter"),
      provider: z.enum(["gmail", "outlook", "yahoo"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.getEmailByAddress(input.email);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Email sudah terdaftar" });
      }

      const id = await db.createEmail({
        userId:   ctx.user.id,
        email:    input.email.toLowerCase().trim(),
        password: input.password,
        provider: input.provider,
        status:   "pending",
      });

      return { success: true, emailId: id, message: "Email berhasil dibuat, menunggu verifikasi" };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await db.getEmailsByUserId(ctx.user.id);
    return accounts.map((a) => ({
      id:        a.id,
      email:     a.email,
      provider:  a.provider,
      status:    a.status,
      createdAt: new Date(a.createdAt),
    }));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const account = await db.getEmailById(input.id);
      if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Email tidak ditemukan" });
      if (account.userId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Akses ditolak" });
      return {
        id:        account.id,
        email:     account.email,
        provider:  account.provider,
        status:    account.status,
        createdAt: new Date(account.createdAt),
      };
    }),
});
