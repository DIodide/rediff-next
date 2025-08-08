/* eslint-disable @typescript-eslint/no-misused-promises */

import ConvexClientProvider from "@/app/ConvexClientProvider";
import { StickyHeader } from "@/components/layout/sticky-header";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default async function LoggedInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StickyHeader className="px-4 py-2">
        <div className="flex justify-between items-center">
          Convex + Next.js + Clerk
          <div className="flex items-center gap-2">
            <SignedOut>
              <SignInButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </StickyHeader>
      <main className="container max-w-2xl flex flex-col gap-8">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </main>
    </>
  );
}
