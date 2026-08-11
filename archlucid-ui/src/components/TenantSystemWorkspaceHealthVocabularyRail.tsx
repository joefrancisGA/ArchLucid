"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildTenantSystemWorkspaceHealthVocabulary,
  resolveTenantSystemWorkspaceHealthLink,
  resolveTenantSystemWorkspaceHealthPeerLinks,
  type TenantSystemWorkspaceHealthSurfaceId,
  type TenantSystemWorkspaceHealthVocabularyModel,
} from "@/lib/vocabulary/tenant-system-workspace-health-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type TenantSystemWorkspaceHealthVocabularyRailProps = {
  /** Surface hosting the strip — marks the current health view and links to the peers. */
  readonly currentSurfaceId: TenantSystemWorkspaceHealthSurfaceId;
  /** Compact one-line strip (default) vs fuller why-three explanation with triad cards. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildTenantSystemWorkspaceHealthVocabulary}. */
  readonly model?: TenantSystemWorkspaceHealthVocabularyModel;
};

/**
 * TB-2252 — Triad vocabulary strip for tenant, system, and workspace health.
 * Mount on all three hubs so operators do not conflate CS, platform, and KPI views.
 */
export function TenantSystemWorkspaceHealthVocabularyRail(
  props: TenantSystemWorkspaceHealthVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildTenantSystemWorkspaceHealthVocabulary();
  const peers = resolveTenantSystemWorkspaceHealthPeerLinks(props.currentSurfaceId);
  const currentLink = resolveTenantSystemWorkspaceHealthLink(props.currentSurfaceId);

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="tenant-system-workspace-health-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        {peers.map((peer, index) => (
          <span key={peer.id}>
            {index > 0 ? " · " : null}
            <Link
              href={peer.href}
              className={cn(OPERATOR_LINK.inline, "font-medium")}
              data-testid={`tenant-system-workspace-health-vocabulary-peer-${peer.id}`}
            >
              {peer.label}
            </Link>
          </span>
        ))}
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="tenant-system-workspace-health-vocabulary-heading"
      data-testid="tenant-system-workspace-health-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="tenant-system-workspace-health-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyThree}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {[model.tenantLink, model.systemLink, model.workspaceLink].map((job) => {
          const isCurrent = currentLink !== null && job.id === currentLink.id;

          if (isCurrent) {
            return (
              <div
                key={job.id}
                className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
                data-testid={`tenant-system-workspace-health-vocabulary-job-${job.id}`}
              >
                <p
                  className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
                  data-testid="tenant-system-workspace-health-vocabulary-current"
                  aria-current="page"
                >
                  {job.label}
                </p>
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {job.whenToUse}
                </p>
              </div>
            );
          }

          return (
            <div
              key={job.id}
              className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
              data-testid={`tenant-system-workspace-health-vocabulary-job-${job.id}`}
            >
              <Link
                href={job.href}
                className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper, "font-medium")}
                data-testid={`tenant-system-workspace-health-vocabulary-peer-${job.id}`}
              >
                {job.label}
              </Link>
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {job.whenToUse}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
