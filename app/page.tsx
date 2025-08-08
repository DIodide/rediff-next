/* eslint-disable @typescript-eslint/no-misused-promises */
import { StickyHeader } from "@/components/layout/sticky-header";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default function Home() {
  return (
    <>
      <StickyHeader className="px-4 py-2">
        <div className="flex justify-between items-center">
          Convex + Next.js + Clerk
          <ClerkActions />
        </div>
      </StickyHeader>
      <main className="container max-w-2xl flex flex-col gap-8">
        <h1 className="text-4xl font-extrabold my-8 text-center">
          Convex + Next.js + Auth.js
        </h1>
        <p>Here is where your marketing message goes.</p>
        <p>The user doesn&apos;t need to log in to see it.</p>
        <p>To interact with the app log in via the button up top.</p>
      </main>
    </>
  );
}

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function ClerkActions() {
  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}
