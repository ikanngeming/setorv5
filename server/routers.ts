import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { publicProcedure, router } from "./_core/trpc";
import { emailsRouter }        from "./routers/emails";
import { depositsRouter }      from "./routers/deposits";
import { notificationsRouter } from "./routers/notifications";
import { settingsRouter }      from "./routers/settings";

export const appRouter = router({
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user ?? null),
    logout: publicProcedure.mutation(({ ctx }) => {
      const opts = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...opts, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  emails:        emailsRouter,
  deposits:      depositsRouter,
  notifications: notificationsRouter,
  settings:      settingsRouter,
});

export type AppRouter = typeof appRouter;
