"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Condensed governance path for first-time operators: links policy packs, review creation, and deeper walkthrough.
 */
export function GovernanceInteractiveQuickstartCard() {
  return (
    <Card
      className="mb-6 border-teal-200/80 bg-teal-50/35 dark:border-teal-900/55 dark:bg-teal-950/20"
      data-testid="governance-interactive-quickstart"
    >
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-base">Governance quick path</CardTitle>
        <CardDescription>
          Use this sequence the first time you move a finalized manifest through approval. Skipping steps is fine once
          your team knows the rhythm.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3 pt-0">
        <ol className="m-0 list-decimal space-y-2 pl-5 text-sm text-neutral-800 dark:text-neutral-200">
          <li>
            <Link href="/policy-packs" className="font-medium text-teal-800 underline dark:text-teal-300">
              Open policy packs
            </Link>
            — assign or publish the rule set that governs your scope.
          </li>
          <li>
            <Link href="/reviews/new" className="font-medium text-teal-800 underline dark:text-teal-300">
              Run an architecture review
            </Link>
            {" — "}
            finalize so you have a manifest version to submit below.
          </li>
          <li>
            Load that review in the approval section on this page, then submit for approval when your role allows.
          </li>
          <li className="text-neutral-600 dark:text-neutral-400">
            Optional deep dive:{" "}
            <Link href="/governance/first-30-days" className="font-medium text-teal-800 underline dark:text-teal-300">
              First 30 days
            </Link>
            .
          </li>
        </ol>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t border-teal-200/60 pt-3 dark:border-teal-900/50">
        <Button asChild size="sm" variant="secondary">
          <Link href="/policy-packs">Policy packs</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/reviews/new">New review</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
