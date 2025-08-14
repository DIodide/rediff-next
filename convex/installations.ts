import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";

export const upsert = internalMutation({
  args: {
    installationId: v.number(),
    accountLogin: v.string(),
    accountType: v.union(v.literal("User"), v.literal("Organization")),
    connectedByUserId: v.optional(v.id("users")),
  },
  async handler(ctx, args) {
    const existing = await ctx.db
      .query("installations")
      .withIndex("byInstallationId", (q) =>
        q.eq("installationId", args.installationId),
      )
      .unique();

    if (existing === null) {
      await ctx.db.insert("installations", {
        provider: "github",
        installationId: args.installationId,
        accountLogin: args.accountLogin,
        accountType: args.accountType,
        connectedByUserId: args.connectedByUserId,
      });
    } else {
      await ctx.db.patch(existing._id, {
        accountLogin: args.accountLogin,
        accountType: args.accountType,
        connectedByUserId: args.connectedByUserId,
      });
    }
  },
});

export const getByInstallationId = internalQuery({
  args: { installationId: v.number() },
  returns: v.any(),
  async handler(ctx, { installationId }) {
    return await ctx.db
      .query("installations")
      .withIndex("byInstallationId", (q) =>
        q.eq("installationId", installationId),
      )
      .unique();
  },
});

export const recordFromGithub = mutation({
  args: {
    installationId: v.number(),
    accountLogin: v.string(),
    accountType: v.union(v.literal("User"), v.literal("Organization")),
    repos: v.array(
      v.object({
        owner: v.string(),
        name: v.string(),
        defaultBranch: v.optional(v.string()),
      }),
    ),
  },
  returns: v.null(),
  async handler(ctx, args) {
    const user = await getCurrentUserOrThrow(ctx);
    // Upsert installation
    const existing = await ctx.db
      .query("installations")
      .withIndex("byInstallationId", (q) =>
        q.eq("installationId", args.installationId),
      )
      .unique();
    if (existing === null) {
      await ctx.db.insert("installations", {
        provider: "github",
        installationId: args.installationId,
        accountLogin: args.accountLogin,
        accountType: args.accountType,
        connectedByUserId: user._id,
      });
    } else {
      await ctx.db.patch(existing._id, {
        accountLogin: args.accountLogin,
        accountType: args.accountType,
        connectedByUserId: user._id,
      });
    }

    // Upsert repos for installation
    for (const repo of args.repos) {
      const repoExisting = await ctx.db
        .query("repos")
        .withIndex("byOwnerAndName", (q) =>
          q.eq("owner", repo.owner).eq("name", repo.name),
        )
        .unique();
      if (repoExisting === null) {
        await ctx.db.insert("repos", {
          provider: "github",
          owner: repo.owner,
          name: repo.name,
          defaultBranch: repo.defaultBranch,
          installationId: args.installationId,
          connectedByUserId: user._id,
        });
      } else {
        await ctx.db.patch(repoExisting._id, {
          defaultBranch: repo.defaultBranch ?? repoExisting.defaultBranch,
          installationId: args.installationId,
          connectedByUserId: user._id,
        });
      }
    }

    return null;
  },
});

export const listMyInstallations = query({
  args: {},
  returns: v.any(),
  async handler(ctx) {
    const user = await getCurrentUserOrThrow(ctx);
    const installs = await ctx.db
      .query("installations")
      .withIndex("byConnectedBy", (q) => q.eq("connectedByUserId", user._id))
      .collect();
    return installs;
  },
});

export const listReposForInstallation = query({
  args: { installationId: v.number() },
  returns: v.any(),
  async handler(ctx, { installationId }) {
    const user = await getCurrentUserOrThrow(ctx);
    const install = await ctx.db
      .query("installations")
      .withIndex("byInstallationId", (q) =>
        q.eq("installationId", installationId),
      )
      .unique();
    if (!install || install.connectedByUserId !== user._id) {
      throw new Error("Not authorized to view this installation");
    }
    const repos = await ctx.db
      .query("repos")
      .withIndex("byInstallationId", (q) =>
        q.eq("installationId", installationId),
      )
      .collect();
    return repos;
  },
});
