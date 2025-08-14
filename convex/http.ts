import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import crypto from "node:crypto";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response("Error occured", { status: 400 });
    }
    switch (event.type) {
      case "user.created": // intentional fallthrough
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        });
        break;

      case "user.deleted": {
        const clerkUserId = event.data.id!;
        await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
        break;
      }
      default:
        console.log("Ignored Clerk webhook event", event.type);
    }

    return new Response(null, { status: 200 });
  }),
});

http.route({
  path: "/github/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("x-hub-signature-256");
    const deliveryId = request.headers.get("x-github-delivery") ?? "";
    const event = request.headers.get("x-github-event") ?? "unknown";
    const rawBody = await request.text();
    const secret = process.env.GITHUB_WEBHOOK_SECRET ?? "";

    const valid = verifyGithubSignature(secret, rawBody, signature);
    if (!valid) return new Response("invalid signature", { status: 401 });

    // record event for idempotency/audit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ctx.runMutation((internal as any).github.recordEvent, {
      idempotencyKey: deliveryId,
      event,
      payload: JSON.parse(rawBody || "{}"),
    });

    // Minimal handling: when repos change, re-sync
    if (event === "installation_repositories") {
      const body = JSON.parse(rawBody || "{}");
      const installationId = body.installation?.id;
      if (typeof installationId === "number") {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await ctx.runAction(
            (api as any).github_sync.syncReposForInstallation,
            {
              installationId,
            },
          );
        } catch (e) {
          console.error("install repos sync failed", e);
        }
      }
    }

    return new Response(null, { status: 202 });
  }),
});

function verifyGithubSignature(
  secret: string,
  body: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
}

export default http;
