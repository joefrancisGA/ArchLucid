"use client";

import Link from "next/link";

import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/**
 * Detail shell for `/governance/policy-packs/[id]` — distinct from `/policy-packs` (registry + lifecycle).
 * Scoped pack inspection and dry-run tooling can extend this route; the default view keeps navigation useful.
 */
export function PolicyPackDetailClient(props: { readonly policyPackId: string }) {
  const { policyPackId } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <OperatorEmptyState title={buyerPolishedShell ? "Policy rules for this workspace" : "Policy pack"}>
        <p className="m-0 max-w-prose text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {buyerPolishedShell ? (
            <>
              Review published versions, see how rules apply to this scope, and continue governance steps from the main{" "}
              <strong className="font-semibold">Policy packs</strong> page.
            </>
          ) : (
            <>
              This workspace routes pack review and version history through the Policy packs registry. Open the registry to
              compare published versions, inspect effective policy for your scope, or continue governance workflow steps.
            </>
          )}
        </p>
        {buyerPolishedShell ? (
          <Collapsible className="mt-3">
            <CollapsibleTrigger className="text-xs font-medium text-teal-800 underline dark:text-teal-300">
              Technical reference
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
                Pack id: <span className="font-mono">{policyPackId}</span>
              </p>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <p className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400">
            Pack reference: <span className="font-mono">{policyPackId}</span>
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="default" size="sm">
            <Link href="/policy-packs">Open Policy packs</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/governance">Governance workflow</Link>
          </Button>
        </div>
      </OperatorEmptyState>
    </main>
  );
}
