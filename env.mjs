import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Convex + NextAuth
    CONVEX_AUTH_PRIVATE_KEY: z.string().min(1),
    NEXTAUTH_SECRET: z.string().min(1).optional(),
    // GitHub OAuth
    AUTH_GITHUB_ID: z.string().min(1),
    AUTH_GITHUB_SECRET: z.string().min(1),
    // Optional: Convex adapter secret and site URL
    CONVEX_AUTH_ADAPTER_SECRET: z.string().min(1).optional(),
    // Clerk + Convex (issuer URL for Convex auth.config)
    CLERK_FRONTEND_API_URL: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_CONVEX_URL: z.string().url(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: {
    CONVEX_AUTH_PRIVATE_KEY: process.env.CONVEX_AUTH_PRIVATE_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    CONVEX_AUTH_ADAPTER_SECRET: process.env.CONVEX_AUTH_ADAPTER_SECRET,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    CLERK_FRONTEND_API_URL: process.env.CLERK_FRONTEND_API_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});

// Convenience re-export for ESM default import style if needed
export default env;
