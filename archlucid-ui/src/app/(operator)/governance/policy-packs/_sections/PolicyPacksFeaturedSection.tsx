"use client";

import Link from "next/link";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isOrganizationCreatedPolicyPack } from "@/lib/editions/securenow-featured-frameworks";
import { policyPacksOrganizationStarterHref } from "@/lib/policy/policy-packs-deep-link";
import { StatusTag } from "@/components/ui/status-tag";
import type { PolicyPackWorkspaceSelectionItem } from "@/types/policy-packs";

type Props = {
  readonly items: readonly PolicyPackWorkspaceSelectionItem[];
};

export function PolicyPacksFeaturedSection(props: Props): React.JSX.Element | null {
  return (
    <section aria-labelledby="policy-packs-featured-heading" data-testid="policy-packs-featured">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 id="policy-packs-featured-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Featured
          </h2>
          <StatusTag kind="neutral" label="Recommended starting frameworks" />
        </div>
        <Link
          href={policyPacksOrganizationStarterHref()}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
          data-testid="policy-packs-start-organization-pack"
        >
          Start an organization pack
        </Link>
      </div>
      {props.items.length > 0 ? (
        <ul className="m-0 list-none divide-y rounded-md border p-0">
          {props.items.map((item) => (
            <li key={item.assignmentId} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className={OPERATOR_TYPOGRAPHY.body}>{item.name}</p>
                {item.description ? (
                  <p className={OPERATOR_TYPOGRAPHY.helper}>{item.description}</p>
                ) : null}
              </div>
              <span className="flex shrink-0 items-center gap-2">
                {isOrganizationCreatedPolicyPack(item.packType) ? (
                  <StatusTag kind="neutral" label="Organization" />
                ) : null}
                <StatusTag kind={item.isEnabled ? "ready" : "neutral"} label={item.isEnabled ? "Enabled" : "Available"} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={OPERATOR_TYPOGRAPHY.helper}>No featured packs are assigned yet. Start with an organization policy pack.</p>
      )}
    </section>
  );
}
