import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const settingsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User tidak ditemukan" });
    return {
      id:        user.id,
      name:      user.name,
      email:     user.email,
      balance:   user.balance,
      status:    user.status,
      role:      user.role,
      createdAt: new Date(user.createdAt),
    };
  }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(2, "Nama minimal 2 karakter") }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUser(ctx.user.id, { name: input.name.trim() });
      return { success: true, message: "Profil berhasil diperbarui" };
    }),

  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    return user?.balance ?? 0;
  }),
});
