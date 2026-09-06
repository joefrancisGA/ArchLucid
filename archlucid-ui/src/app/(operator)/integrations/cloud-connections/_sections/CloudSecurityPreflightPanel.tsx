"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type {
  CloudSecurityPreflightTopic,
  CloudSecurityPreflightVerificationState,
} from "@/lib/cloud-security-preflight-topics";
import { formatAzureConnectionTimestamp } from "@/lib/azure-connection-present";
import {
  cloudSecurityPreflightDisclosureHrefFromSearch,
  parseCloudSecurityPreflightOpenFromSearch,
} from "@/lib/integrations/cloud-security-preflight-disclosure-url";
import {
  cloudSecurityPreflightTechnicalDetailsDisclosureHrefFromSearch,
  parseCloudSecurityPreflightTechnicalDetailsOpenFromSearch,
} from "@/lib/integrations/cloud-security-preflight-technical-details-disclosure-url";
import { cn } from "@/lib/utils";

export type CloudSecurityPreflightPanelProps = {
  readonly topics: readonly CloudSecurityPreflightTopic[];
  readonly providerLabel: string;
  /** Collapse the checklist to a one-line summary until expanded (P0-2). */
  readonly collapsedByDefault?: boolean;
  /** Topics verified after a successful validation run (P0-5). */
  readonly verifiedTopics?: CloudSecurityPreflightVerificationState;
};

function CloudSecurityPreflightTopicRow(props: {
  readonly topic: CloudSecurityPreflightTopic;
  readonly verifiedUtc: string | null;
}): React.ReactElement {
  const { topic, verifiedUtc } = props;
  const isVerified = verifiedUtc !== null;

  return (
    <li className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{topic.label}</p>
        {isVerified ? (
          <StatusTag
            kind="ready"
            label={`Verified ${formatAzureConnectionTimestamp(verifiedUtc)}`}
            data-testid={`cloud-security-preflight-verified-${topic.id}`}
          />
        ) : null}
      </div>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{topic.detail}</p>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
        <Link
          href={topic.trustCenterControl.href}
          className={OPERATOR_LINK.inline}
          data-testid={`cloud-security-preflight-citation-${topic.id}`}
        >
          {topic.trustCenterControl.label}
        </Link>
      </p>
    </li>
  );
}

/** Read-only security review checklist — not a persisted attestation control. */
export function CloudSecurityPreflightPanel(props: CloudSecurityPreflightPanelProps): React.ReactElement {
  const { topics, providerLabel, collapsedByDefault = true, verifiedTopics } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/integrations/cloud-connections";
  const searchParams = useSearchParams();
  const cloudSecurityPreflightOpenParam = searchParams.get("cloudSecurityPreflightOpen");
  const [preflightOpen, setPreflightOpenState] = useState(() =>
    parseCloudSecurityPreflightOpenFromSearch(cloudSecurityPreflightOpenParam),
  );

  const syncPreflightOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        cloudSecurityPreflightDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPreflightOpen = useCallback(
    (open: boolean) => {
      setPreflightOpenState(open);
      syncPreflightOpenToUrl(open);
    },
    [syncPreflightOpenToUrl],
  );

  useEffect(() => {
    setPreflightOpenState(parseCloudSecurityPreflightOpenFromSearch(cloudSecurityPreflightOpenParam));
  }, [cloudSecurityPreflightOpenParam]);

  const summaryLine = `${topics.length} access controls reviewed for ${providerLabel} — expand for cited details.`;

  const topicList = (
    <ul className="space-y-4">
      {topics.map((topic) => (
        <CloudSecurityPreflightTopicRow
          key={topic.id}
          topic={topic}
          verifiedUtc={
            topic.verifiableAfterConnection === true && verifiedTopics?.[topic.id] !== undefined
              ? verifiedTopics[topic.id]?.verifiedUtc ?? null
              : null
          }
        />
      ))}
    </ul>
  );

  return (
    <section
      className="space-y-4"
      data-testid="cloud-security-preflight"
      aria-label={`${providerLabel} security preflight checklist`}
    >
      {collapsedByDefault ? (
        <details
          className="rounded-md border border-neutral-200 bg-neutral-50/60 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40"
          open={preflightOpen}
          onToggle={(event) => {
            setPreflightOpen((event.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
            {summaryLine}
          </summary>
          <div className="mt-3">{topicList}</div>
        </details>
      ) : (
        topicList
      )}
    </section>
  );
}

export type CloudSecurityPreflightTechnicalDetailsProps = {
  readonly children: React.ReactNode;
};

/** Collapsed implementation notes — provider-specific technical content only. */
export function CloudSecurityPreflightTechnicalDetails(props: CloudSecurityPreflightTechnicalDetailsProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/integrations/cloud-connections";
  const searchParams = useSearchParams();
  const cloudSecurityPreflightTechnicalDetailsOpenParam = searchParams.get("cloudSecurityPreflightTechnicalDetailsOpen");
  const [technicalDetailsOpen, setTechnicalDetailsOpenState] = useState(() =>
    parseCloudSecurityPreflightTechnicalDetailsOpenFromSearch(cloudSecurityPreflightTechnicalDetailsOpenParam),
  );

  const syncTechnicalDetailsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        cloudSecurityPreflightTechnicalDetailsDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setTechnicalDetailsOpen = useCallback(
    (open: boolean) => {
      setTechnicalDetailsOpenState(open);
      syncTechnicalDetailsOpenToUrl(open);
    },
    [syncTechnicalDetailsOpenToUrl],
  );

  useEffect(() => {
    setTechnicalDetailsOpenState(
      parseCloudSecurityPreflightTechnicalDetailsOpenFromSearch(cloudSecurityPreflightTechnicalDetailsOpenParam),
    );
  }, [cloudSecurityPreflightTechnicalDetailsOpenParam]);

  return (
    <details
      className="rounded-md border border-neutral-200 bg-neutral-50/60 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40"
      open={technicalDetailsOpen}
      onToggle={(event) => {
        setTechnicalDetailsOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        Technical details
      </summary>
      <div className={cn("mt-2 space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.children}</div>
    </details>
  );
}
