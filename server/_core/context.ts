import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../types";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    if (process.env.NODE_ENV === "development") {
      user = {
        id: 1,
        openId: "dev-user",
        name: "Developer",
        email: "dev@example.com",
        role: "admin",
        status: "active",
        balance: 1000000,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };
    } else {
      user = null;
    }
  }
  return { req: opts.req, res: opts.res, user };
}
