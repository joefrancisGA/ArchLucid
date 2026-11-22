"use client";

import { cn } from "@/lib/utils";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { RefreshButton } from "@/components/ui/refresh-button";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { PolicyPackCatalogListItem } from "@/types/policy-packs";
import { POLICY_PACKS_CATALOG_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/policy/policy-packs-catalog-empty-honesty-copy";
import { PolicyPacksCatalogEmptyPartialHonesty } from "@/app/(operator)/governance/policy-packs/_sections/PolicyPacksCatalogEmptyPartialHonesty";
import { PolicyPacksCatalogLoadFailurePartialHonesty } from "@/app/(operator)/governance/policy-packs/_sections/PolicyPacksCatalogLoadFailurePartialHonesty";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { useProductLine } from "@/components/product-line/ProductLineProvider";

type PolicyPacksCatalogSectionProps = {
  readonly canMutatePacks: boolean;
  readonly loading: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly items: PolicyPackCatalogListItem[];
  readonly selectedCatalogEntryId: string;
  readonly onSelectedCatalogEntryIdChange: (id: string) => void;
  readonly onRefresh: () => void;
  readonly onClone: () => void;
};

/**
 * Platform catalog of promoted policy pack snapshots (read-only list; clone creates a tenant-owned pack).
 */
export function PolicyPacksCatalogSection(props: PolicyPacksCatalogSectionProps) {
  const { productLine } = useProductLine();
  const selected = props.items.find(
    (x) => x.policyPackCatalogEntryId === props.selectedCatalogEntryId,
  );

  return (
    <section className="flex flex-col gap-4" aria-label="Policy pack catalog">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Catalog</h2>
        <RefreshButton
          label="Refresh catalog"
          busy={props.loading}
          data-testid="policy-packs-catalog-refresh"
          onClick={() => {
            void props.onRefresh();
          }}
        />
        <button
          type="button"
          className={cn(
            "rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:opacity-90",
            OPERATOR_TYPOGRAPHY.button,
            (!props.canMutatePacks || !selected || props.loading) && "pointer-events-none opacity-50",
          )}
          onClick={() => {
            void props.onClone();
          }}
          disabled={!props.canMutatePacks || selected === undefined || props.loading}
          aria-label="Clone selected catalog pack into your workspace"
          data-testid="policy-packs-catalog-clone"
        >
          Clone into my packs
        </button>
      </div>

      <p className={cn("text-muted-foreground", OPERATOR_TYPOGRAPHY.body)}>
        Browse platform-curated snapshots. Cloning copies snapshot content into a new pack you own — nothing is shared
        back to other tenants.
      </p>

      {props.failure !== null ? (
        <div className="space-y-2" role="alert" data-testid="policy-packs-catalog-load-failure">
          <OperatorApiProblem
            problem={props.failure.problem}
            fallbackMessage={props.failure.message}
            correlationId={props.failure.correlationId}
          />
          <PolicyPacksCatalogLoadFailurePartialHonesty />
          <FatalPageReportProblemSupportRow
            surfaceId={
              productLine === "security"
                ? "compliance-policy-packs-catalog-hard-failure"
                : "governance-policy-packs-catalog-hard-failure"
            }
            errorTitle="Policy pack catalog"
            errorCode="policy-packs-catalog-load-failed"
            correlationId={props.failure.correlationId}
            httpStatus={props.failure.httpStatus}
          />
        </div>
      ) : null}

      {props.items.length === 0 && !props.loading && props.failure === null ? (
        <div className="space-y-2">
          <p className={cn("text-muted-foreground", OPERATOR_TYPOGRAPHY.body)}>
            No promoted catalog snapshots yet. Bundled platform packs live on the <strong>My packs</strong> tab — use the
            workspace selection list there to turn packs on or off.
          </p>
          <p
            className={cn("m-0 text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="policy-packs-catalog-empty-not-load-failure"
          >
            {POLICY_PACKS_CATALOG_EMPTY_NOT_LOAD_FAILURE_LINE}
          </p>
          <PolicyPacksCatalogEmptyPartialHonesty />
        </div>
      ) : null}

      <ul className="divide-y rounded-md border">
        {props.items.map((row) => {
          const id = row.policyPackCatalogEntryId;

          if (id === undefined || id === "") {
            return null;
          }

          const active = id === props.selectedCatalogEntryId;

              return (
            <li key={id}>
              <button
                type="button"
                aria-label={
                  active
                    ? `${row.displayName}, version ${row.snapshotVersion}, selected`
                    : `${row.displayName}, version ${row.snapshotVersion}`
                }
                className={cn(
                  "flex w-full flex-col items-start gap-1 px-3 py-2 text-left hover:bg-accent",
                  active && "bg-accent",
                )}
                onClick={() => {
                  props.onSelectedCatalogEntryIdChange(id);
                }}
              >
                <span className={OPERATOR_TYPOGRAPHY.body}>{row.displayName}</span>
                <span className={cn("text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)}>
                  {row.packType} · v{row.snapshotVersion}
                </span>
                {row.description ? (
                  <span className={cn("text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)}>{row.description}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
