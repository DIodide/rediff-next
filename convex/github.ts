import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// An internal mutation can only be called from other mutations or the
// server.
export const recordEvent = internalMutation({
  args: {
    idempotencyKey: v.string(),
    event: v.string(),
    payload: v.any(),
  },
  async handler(ctx, { idempotencyKey, event, payload }) {
    const existing = await ctx.db
      .query("github_events")
      .withIndex("byIdempotencyKey", (q) =>
        q.eq("idempotencyKey", idempotencyKey),
      )
      .unique();
    if (existing === null) {
      await ctx.db.insert("github_events", { idempotencyKey, event, payload });
    }
  },
});
