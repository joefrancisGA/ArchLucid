"use client";

import { cn } from "@/lib/utils";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { PolicyPackCatalogListItem } from "@/types/policy-packs";

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
  const selected = props.items.find(
    (x) => x.policyPackCatalogEntryId === props.selectedCatalogEntryId,
  );

  return (
    <section className="flex flex-col gap-4" aria-label="Policy pack catalog">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Catalog</h2>
        <button
          type="button"
          className={cn(
            "rounded-md border border-input bg-background px-3 py-1.5 hover:bg-accent",
            OPERATOR_TYPOGRAPHY.tab,
            props.loading && "pointer-events-none opacity-60",
          )}
          onClick={() => {
            void props.onRefresh();
          }}
          disabled={props.loading}
          data-testid="policy-packs-catalog-refresh"
        >
          Refresh catalog
        </button>
        <button
          type="button"
          className={cn(
            "rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:opacity-90",
            OPERATOR_TYPOGRAPHY.tab,
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
        <div role="alert">
          <OperatorApiProblem
            problem={props.failure.problem}
            fallbackMessage={props.failure.message}
            correlationId={props.failure.correlationId}
          />
        </div>
      ) : null}

      {props.items.length === 0 && !props.loading ? (
        <p className={cn("text-muted-foreground", OPERATOR_TYPOGRAPHY.body)}>No promoted catalog entries yet.</p>
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
                  OPERATOR_TYPOGRAPHY.body,
                  active && "bg-accent",
                )}
                onClick={() => {
                  props.onSelectedCatalogEntryIdChange(id);
                }}
              >
                <span className="font-medium">{row.displayName}</span>
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
