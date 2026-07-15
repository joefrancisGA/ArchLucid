"use client";

import { EmptyState } from "@/components/EmptyState";

export type OperateGatedEmptyStateProps = {
  readonly featureLabel: string;
};

/** Shown on Operate routes when no committed architecture review exists yet. */
export function OperateGatedEmptyState(props: OperateGatedEmptyStateProps): React.JSX.Element {
  return (
    <EmptyState
      title={`${props.featureLabel} unlocks after your first committed review`}
      description="Finalize one architecture review to produce a signed review record. Operate surfaces (compare, alerts, digests, and more) appear in the sidebar once that milestone is recorded."
      actions={[{ label: "Create your first review", href: "/reviews/new", variant: "primary" }]}
    />
  );
}
