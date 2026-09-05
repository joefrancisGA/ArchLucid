"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useCallback, type ReactElement, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import {
  resolveConnectorDisplayStatusTag,
  type ConnectorDisplayStatus,
} from "@/lib/connector-operations-present";
import type {
  IntegrationReadinessSummaryTile,
  IntegrationRecommendedFirstSetup,
} from "@/lib/connector-readiness-summary";
import { INTEGRATION_READINESS_OPTIONAL_SUPPORTING_COPY } from "@/lib/connector-readiness-summary";
import { formatIntegrationReadinessLastChecked } from "@/lib/integration-readiness-present";
import { CTA_WIDTH, OPERATOR_TYPOGRAPHY, operatorSemanticSurface } from "@/lib/design-tokens";
import {
  integrationReadinessTechnicalDetailsHrefFromSearch,
  parseIntegrationReadinessTechIdFromSearch,
} from "@/lib/integrations/integration-readiness-technical-details-url";

function summaryTileSurfaceClass(tone: IntegrationReadinessSummaryTile["tone"]): string {
  switch (tone) {
    case "healthy":
      return operatorSemanticSurface("ready");

    case "attention":
      return operatorSemanticSurface("warn");

    case "disabled":
      return operatorSemanticSurface("neutral");

    default:
      return operatorSemanticSurface("neutral");
  }
}

type IntegrationReadinessSummaryStripProps = {
  readonly headline: string;
  readonly tiles: readonly IntegrationReadinessSummaryTile[];
  readonly configurationReadAt: Date;
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
          {formatIntegrationReadinessLastChecked(props.configurationReadAt)}
        </p>
      </div>
      <dl className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-5">
        {props.tiles.map((tile) => (
          <div
            key={tile.id}
            className={cn("rounded-md border px-3 py-2", summaryTileSurfaceClass(tile.tone))}
            data-testid={`integration-readiness-tile-${tile.id}`}
          >
            <dt className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.badge)}>{tile.label}</dt>
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
      className={cn("rounded-lg border p-4", operatorSemanticSurface("info"))}
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
          <Button variant="default" size="sm" className={CTA_WIDTH.content} asChild>
            <Link href={setup.href}>{setup.actionLabel}</Link>
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
  readonly connectorKey: string;
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const integrationReadinessTechIdParam = searchParams.get("integrationReadinessTechId");
  const urlTechId = parseIntegrationReadinessTechIdFromSearch(integrationReadinessTechIdParam);
  const expanded = urlTechId === props.connectorKey;

  const syncExpandedToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        integrationReadinessTechnicalDetailsHrefFromSearch(
          searchParams.toString(),
          open ? props.connectorKey : null,
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, props.connectorKey, router, searchParams],
  );

  return (
    <div className="mt-2">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200",
          OPERATOR_TYPOGRAPHY.helper,
        )}
        aria-expanded={expanded}
        onClick={() => {
          syncExpandedToUrl(!expanded);
        }}
      >
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", expanded ? "rotate-180" : "")}
          aria-hidden
        />
        <span className="underline underline-offset-2">{props.label}</span>
      </button>
      {expanded ? (
        <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{props.children}</p>
      ) : null}
    </div>
  );
}

export type IntegrationConnectorInventoryRow = {
  readonly key: string;
  readonly title: string;
  readonly displayStatus: ConnectorDisplayStatus;
  readonly guidance: string;
  readonly configurationHref: string | null;
  readonly rowActionLabel: string | null;
  readonly detailsLabel: string | null;
  readonly technicalDetails: string;
  readonly disabledForDeployment: boolean;
  readonly testId: string;
};

type IntegrationConnectorInventoryTableProps = {
  readonly rows: readonly IntegrationConnectorInventoryRow[];
  readonly ariaLabel: string;
  readonly testId: string;
};

export function IntegrationConnectorInventoryTable(props: IntegrationConnectorInventoryTableProps): ReactElement {
  const statusTag = (displayStatus: ConnectorDisplayStatus): ReactElement => {
    const resolved = resolveConnectorDisplayStatusTag(displayStatus);

    return <StatusTag kind={resolved.kind} label={resolved.label} />;
  };

  return (
    <EnterpriseTable ariaLabel={props.ariaLabel} data-testid={props.testId}>
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>Integration</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {props.rows.map((row) => (
          <EnterpriseTableRow key={row.key} data-testid={row.testId}>
            <EnterpriseTableCell>
              <div className="space-y-1">
                <span className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                  {row.title}
                </span>
                <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{row.guidance}</p>
                {row.disabledForDeployment ? (
                  <p
                    className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid={`${row.testId}-disabled-copy`}
                  >
                    Disabled for this deployment
                  </p>
                ) : null}
                {row.technicalDetails.trim().length > 0 && row.detailsLabel ? (
                  <IntegrationReadinessTechnicalDetails connectorKey={row.key} label={row.detailsLabel}>
                    {row.technicalDetails}
                  </IntegrationReadinessTechnicalDetails>
                ) : null}
              </div>
            </EnterpriseTableCell>
            <EnterpriseTableCell>{statusTag(row.displayStatus)}</EnterpriseTableCell>
            <EnterpriseTableCell>
              {!row.disabledForDeployment && row.configurationHref && row.rowActionLabel ? (
                <Button variant="outline" size="sm" className={CTA_WIDTH.content} asChild>
                  <Link href={row.configurationHref}>{row.rowActionLabel}</Link>
                </Button>
              ) : (
                <span className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>—</span>
              )}
            </EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
