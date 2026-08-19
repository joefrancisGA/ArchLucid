"use client";

import { EmptyState } from "@/components/EmptyState";

export type OperateGatedEmptyStateProps = {
  readonly featureLabel: string;
};

/** Shown on Operate routes when no finalized architecture review exists yet. */
export function OperateGatedEmptyState(props: OperateGatedEmptyStateProps): React.JSX.Element {
  return (
    <EmptyState
      title={`${props.featureLabel} becomes available after your first finalized review`}
      description="Finalize one architecture review to produce a sealed review record. Operate destinations (compare, alerts, digests, and more) appear in the sidebar once that review is recorded."
      actions={[{ label: "Create your first review", href: "/architecture/reviews/new", variant: "primary" }]}
    />
  );
}
