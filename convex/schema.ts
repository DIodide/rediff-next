import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),

  users: defineTable({
    name: v.string(),
    // this the Clerk ID, stored in the subject JWT field
    externalId: v.string(),
    email: v.optional(v.string()),
    githubId: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
    githubAvatarUrl: v.optional(v.string()),
  }).index("byExternalId", ["externalId"]),

  // GitHub App installations across accounts (user/org)
  installations: defineTable({
    provider: v.literal("github"),
    installationId: v.number(),
    accountLogin: v.string(),
    accountType: v.union(v.literal("User"), v.literal("Organization")),
    // optional linkage to the user who connected it
    connectedByUserId: v.optional(v.id("users")),
  })
    .index("byInstallationId", ["installationId"]) // unique per provider
    .index("byAccountLogin", ["accountLogin"]) // list by account login
    .index("byConnectedBy", ["connectedByUserId"]),

  // Repositories accessible via an installation
  repos: defineTable({
    provider: v.literal("github"),
    owner: v.string(),
    name: v.string(),
    defaultBranch: v.optional(v.string()),
    installationId: v.number(),
    connectedByUserId: v.optional(v.id("users")),
  })
    .index("byOwnerAndName", ["owner", "name"]) // to find repos quickly
    .index("byInstallationId", ["installationId"]) // list by installation
    .index("byConnectedBy", ["connectedByUserId"]),

  // Raw webhook events for audit/debugging and reprocessing
  github_events: defineTable({
    idempotencyKey: v.string(), // delivery id
    event: v.string(),
    payload: v.any(),
    handledAt: v.optional(v.number()),
  }).index("byIdempotencyKey", ["idempotencyKey"]),
});
