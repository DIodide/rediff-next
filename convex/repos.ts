import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const upsertManyForInstallation = internalMutation({
  args: {
    installationId: v.number(),
    repos: v.array(
      v.object({
        owner: v.string(),
        name: v.string(),
        defaultBranch: v.optional(v.string()),
      }),
    ),
    connectedByUserId: v.optional(v.id("users")),
  },
  async handler(ctx, { installationId, repos, connectedByUserId }) {
    for (const repo of repos) {
      const existing = await ctx.db
        .query("repos")
        .withIndex("byOwnerAndName", (q) =>
          q.eq("owner", repo.owner).eq("name", repo.name),
        )
        .unique();
      if (existing === null) {
        await ctx.db.insert("repos", {
          provider: "github",
          owner: repo.owner,
          name: repo.name,
          defaultBranch: repo.defaultBranch,
          installationId,
          connectedByUserId,
        });
      } else {
        await ctx.db.patch(existing._id, {
          defaultBranch: repo.defaultBranch ?? existing.defaultBranch,
          installationId,
          connectedByUserId: connectedByUserId ?? existing.connectedByUserId,
        });
      }
    }
  },
});

export const listByInstallation = internalQuery({
  args: { installationId: v.number() },
  returns: v.any(),
  async handler(ctx, { installationId }) {
    return await ctx.db
      .query("repos")
      .withIndex("byInstallationId", (q) =>
        q.eq("installationId", installationId),
      )
      .collect();
  },
});
