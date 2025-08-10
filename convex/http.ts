import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
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
    await ctx.runMutation(internal.github.recordEvent, {
      idempotencyKey: deliveryId,
      event,
      payload: JSON.parse(rawBody || "{}"),
    });

    // TODO: handle events: push, pull_request, check_suite, installation_repositories
    // This will be expanded in milestone 3/4

    return new Response(null, { status: 202 });
  }),
});

function verifyGithubSignature(
  secret: string,
  body: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;
  try {
    const encoder = new TextEncoder();
    const key = crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    // crypto.subtle is async; wrap in sync-like helper
    // but Convex actions are async so we can block here via Atomics? Simpler: fallback to Node crypto
  } catch {}
  // Fallback to Node's crypto (Convex runtime supports Node APIs in httpAction)
  const nodeCrypto = require("crypto");
  const expected =
    "sha256=" +
    nodeCrypto.createHmac("sha256", secret).update(body).digest("hex");
  // constant-time compare
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return nodeCrypto.timingSafeEqual(a, b);
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
