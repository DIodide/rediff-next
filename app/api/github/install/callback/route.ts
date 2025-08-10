import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { env } from "@/env.mjs";

// This endpoint completes the GitHub App installation flow after the user approves the install.
// It expects the following search params from GitHub's redirect:
//   installation_id: number
//   setup_action: string ("install" or "update")
// Optional: we can fetch repo list here via GitHub API using the app token, but for MVP we accept repos via client call.

export async function GET(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const url = new URL(request.url);
  const installationId = Number(url.searchParams.get("installation_id"));
  const accountLogin = url.searchParams.get("account_login") ?? "";
  const accountType = (url.searchParams.get("account_type") ?? "User") as
    | "User"
    | "Organization";

  if (!installationId || !accountLogin) {
    return NextResponse.json(
      { error: "Missing installation params" },
      { status: 400 },
    );
  }

  // For MVP, repos are not pulled automatically here. The client can call a separate flow to provide repos.
  const repos: Array<{ owner: string; name: string; defaultBranch?: string }> =
    [];

  const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  await convex.mutation(api.installations.recordFromGithub, {
    installationId,
    accountLogin,
    accountType,
    repos,
  });

  // Redirect back to dashboard (or a success page)
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
