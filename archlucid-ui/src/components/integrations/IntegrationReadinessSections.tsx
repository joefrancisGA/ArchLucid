"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  displayStatusBadgeClass,
  type ConnectorDisplayStatus,
} from "@/lib/connector-operations-present";
import type {
  IntegrationReadinessSummaryTile,
  IntegrationRecommendedFirstSetup,
} from "@/lib/connector-readiness-summary";
import { INTEGRATION_READINESS_OPTIONAL_SUPPORTING_COPY } from "@/lib/connector-readiness-summary";
import { formatIntegrationReadinessLastChecked } from "@/lib/integration-readiness-present";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function summaryTileToneClass(tone: IntegrationReadinessSummaryTile["tone"]): string {
  switch (tone) {
    case "healthy":
      return "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30";
    case "attention":
      return "border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30";
    case "disabled":
      return "border-neutral-200 bg-neutral-100/80 dark:border-neutral-700 dark:bg-neutral-900/60";
    default:
      return "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900";
  }
}

type IntegrationReadinessSummaryStripProps = {
  readonly headline: string;
  readonly tiles: readonly IntegrationReadinessSummaryTile[];
  readonly lastCheckedAt: Date;
};

export function IntegrationReadinessSummaryStrip(props: IntegrationReadinessSummaryStripProps): ReactElement {
  return (
    <section
      className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="integration-readiness-summary"
    >
      <div className="space-y-1">
        <p
          className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}
          data-testid="integration-readiness-headline"
        >
          {props.headline}
        </p>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {INTEGRATION_READINESS_OPTIONAL_SUPPORTING_COPY}
        </p>
        <p
          className={cn("m-0 text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.micro)}
          data-testid="integration-readiness-last-checked"
        >
          {formatIntegrationReadinessLastChecked(props.lastCheckedAt)}
        </p>
      </div>
      <dl className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-5">
        {props.tiles.map((tile) => (
          <div
            key={tile.id}
            className={cn("rounded-md border px-3 py-2", summaryTileToneClass(tile.tone))}
            data-testid={`integration-readiness-tile-${tile.id}`}
          >
            <dt className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{tile.label}</dt>
            <dd className={cn("m-0 mt-1 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
              {tile.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

type IntegrationRecommendedFirstSetupCardProps = {
  readonly setup: IntegrationRecommendedFirstSetup;
};

export function IntegrationRecommendedFirstSetupCard(props: IntegrationRecommendedFirstSetupCardProps): ReactElement {
  const { setup } = props;

  return (
    <section
      className="rounded-lg border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-900 dark:bg-sky-950/20"
      data-testid="integration-readiness-recommended-first-setup"
    >
      <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Recommended first setup
      </h2>
      <p className={cn("m-0 mt-2 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        {setup.title}
      </p>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{setup.detail}</p>
      {setup.href ? (
        <div className="mt-3 space-y-1">
          <Button variant="default" size="sm" className="w-fit" asChild>
            <Link href={setup.href}>Configure</Link>
          </Button>
          {setup.configureHelper ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {setup.configureHelper}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function IntegrationReadinessTechnicalDetails(props: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <details className="group mt-3">
      <summary
        className={cn(
          "inline-flex cursor-pointer list-none items-center gap-1 text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200",
          OPERATOR_TYPOGRAPHY.helper,
        )}
      >
        <span className="underline underline-offset-2">{props.label}</span>
      </summary>
      <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{props.children}</p>
    </details>
  );
}

type ConnectorReadinessCardProps = {
  readonly title: string;
  readonly displayStatus: ConnectorDisplayStatus;
  readonly guidance: string;
  readonly bestFor: string | null;
  readonly configurationHref: string | null;
  readonly configureHelper: string | null;
  readonly detailsLabel: string | null;
  readonly technicalDetails: string;
  readonly disabledForDeployment: boolean;
  readonly testId: string;
};

export function ConnectorReadinessCard(props: ConnectorReadinessCardProps): ReactElement {
  return (
    <li
      className="flex h-full flex-col rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
      data-testid={props.testId}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <strong className={cn("text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>{props.title}</strong>
        <Badge variant="outline" className={cn(OPERATOR_TYPOGRAPHY.helper, displayStatusBadgeClass(props.displayStatus))}>
          {props.displayStatus}
        </Badge>
      </div>
      {props.bestFor ? (
        <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{props.bestFor}</p>
      ) : null}
      <p className={cn("mt-2 flex-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{props.guidance}</p>
      {props.disabledForDeployment ? (
        <p
          className={cn("m-0 mt-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`${props.testId}-disabled-copy`}
        >
          Disabled for this deployment
        </p>
      ) : null}
      {!props.disabledForDeployment && props.configurationHref ? (
        <div className="mt-3 space-y-1">
          <Button variant="outline" size="sm" className="w-fit" asChild>
            <Link href={props.configurationHref}>Configure</Link>
          </Button>
          {props.configureHelper ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {props.configureHelper}
            </p>
          ) : null}
        </div>
      ) : null}
      {props.technicalDetails.trim().length > 0 && props.detailsLabel ? (
        <IntegrationReadinessTechnicalDetails label={props.detailsLabel}>
          {props.technicalDetails}
        </IntegrationReadinessTechnicalDetails>
      ) : null}
    </li>
  );
}
