"use client";

import { useEffect, useState } from "react";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { env } from "@/env.mjs";

type Installation = {
  installationId: number;
  accountLogin: string;
  accountType: "User" | "Organization";
};

type Repo = {
  owner: string;
  name: string;
  defaultBranch?: string;
};

export default function DashboardPage() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [reposByInstall, setReposByInstall] = useState<Record<number, Repo[]>>(
    {},
  );

  useEffect(() => {
    const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
    void convex
      .query(api.installations.listMyInstallations, {})
      .then((insts) => {
        setInstallations(insts as Installation[]);
        for (const ins of insts as Installation[]) {
          void convex
            .query(api.installations.listReposForInstallation, {
              installationId: ins.installationId,
            })
            .then((repos) => {
              setReposByInstall((prev) => ({
                ...prev,
                [ins.installationId]: repos as Repo[],
              }));
            });
        }
      });
  }, []);

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Installations & Repositories</h1>
      {installations.length === 0 ? (
        <p>No installations yet. Install the GitHub App to get started.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {installations.map((ins) => (
            <section
              key={ins.installationId}
              className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900"
            >
              <h2 className="font-semibold">
                {ins.accountLogin} ({ins.accountType}) — #{ins.installationId}
              </h2>
              <ul className="list-disc pl-6 mt-2">
                {(reposByInstall[ins.installationId] || []).map((r) => (
                  <li key={`${r.owner}/${r.name}`}>
                    {r.owner}/{r.name}
                    {r.defaultBranch ? ` (default: ${r.defaultBranch})` : ""}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
