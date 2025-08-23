"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import crypto from "node:crypto";

// An action is something that can have a side effect
export const verifyGithubSignature = action({
  args: {
    secret: v.string(),
    body: v.string(),
    signatureHeader: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, { secret, body, signatureHeader }) => {
    if (!signatureHeader) return false;
    const expected =
      "sha256=" +
      crypto.createHmac("sha256", secret).update(body).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  },
});
