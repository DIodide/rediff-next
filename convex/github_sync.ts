"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import crypto from "node:crypto";
import { internal } from "./_generated/api";

function base64url(input: Buffer | string): string {
  const base = Buffer.isBuffer(input)
    ? input.toString("base64")
    : Buffer.from(input).toString("base64");
  return base.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function signJwtRS256(appId: string, privateKeyPem: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iat: now - 60,
    exp: now + 9 * 60,
    iss: appId,
  };
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const unsigned = `${headerB64}.${payloadB64}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsigned)
    .sign(privateKeyPem);
  const sigB64 = base64url(signature);
  return `${unsigned}.${sigB64}`;
}

export const syncReposForInstallation = action({
  args: { installationId: v.number() },
  returns: v.object({ synced: v.number() }),
  handler: async (ctx, { installationId }) => {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY;
    if (!appId || !privateKey) {
      throw new Error("Missing GITHUB_APP_ID or GITHUB_PRIVATE_KEY");
    }

    const appJwt = signJwtRS256(appId, privateKey);

    // Exchange for installation token
    const tokenRes = await ctx.fetch(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${appJwt}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "rediff-ml-sandbox",
        },
      },
    );
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(
        `Failed to fetch installation token: ${tokenRes.status} ${text}`,
      );
    }
    const tokenJson = (await tokenRes.json()) as { token: string };
    const installationToken = tokenJson.token;

    // List repositories for installation
    const reposRes = await ctx.fetch(
      `https://api.github.com/installation/repositories`,
      {
        headers: {
          Authorization: `Bearer ${installationToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "rediff-ml-sandbox",
        },
      },
    );
    if (!reposRes.ok) {
      const text = await reposRes.text();
      throw new Error(
        `Failed to list repositories: ${reposRes.status} ${text}`,
      );
    }
    const reposJson = (await reposRes.json()) as {
      repositories: Array<{
        name: string;
        default_branch: string;
        owner: { login: string };
      }>;
    };

    const repos = reposJson.repositories.map((r) => ({
      owner: r.owner.login,
      name: r.name,
      defaultBranch: r.default_branch,
    }));

    await ctx.runMutation(internal.repos.upsertManyForInstallation, {
      installationId,
      repos,
    });

    return { synced: repos.length } as const;
  },
});
