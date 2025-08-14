import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Clerk backend secret
    CLERK_SECRET_KEY: z.string().min(1),
    // Clerk Frontend API URL (issuer) used by Convex auth.config
    CLERK_FRONTEND_API_URL: z.string().url(),
    // Clerk webhook signing secret for Convex HTTP endpoint verification
    CLERK_WEBHOOK_SECRET: z.string().min(1),
    // GitHub webhook secret used to validate deliveries
    GITHUB_WEBHOOK_SECRET: z.string().min(1),
    // GitHub App credentials (for repo sync)
    GITHUB_APP_ID: z.string().min(1),
    GITHUB_PRIVATE_KEY: z.string().min(1),
  },
  client: {
    // Convex deployment URL for browser client
    NEXT_PUBLIC_CONVEX_URL: z.string().url(),
    // Clerk publishable key for browser
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_FRONTEND_API_URL: process.env.CLERK_FRONTEND_API_URL,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
    GITHUB_APP_ID: process.env.GITHUB_APP_ID,
    GITHUB_PRIVATE_KEY: process.env.GITHUB_PRIVATE_KEY,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});

export default env;
