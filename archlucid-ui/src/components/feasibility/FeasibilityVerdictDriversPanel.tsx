import Link from "next/link";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { graphFindingDetailHref } from "@/lib/graph-finding-deep-links";
import type {
  FeasibilityVerdictDriver,
  FeasibilityVerdictDriverKind,
} from "@/lib/feasibility-verdict-transparency-trail";
import type { TransparencyTrail } from "@/types/feasibility-verdict";
import { cn } from "@/lib/utils";

function driverKindLabel(kind: FeasibilityVerdictDriverKind): string {
  switch (kind) {
    case "blocking-finding":
      return "Blocking finding severity";

    case "policy-violation":
      return "Policy violation";

    case "manifest-issue":
      return "Unresolved manifest issue";

    case "uncovered-requirement":
      return "Uncovered requirement";

    case "skipped-must-question":
      return "Skipped MUST intake question";

    default:
      return "Driver";
  }
}

function FeasibilityVerdictDriverRow(props: {
  readonly driver: FeasibilityVerdictDriver;
  readonly reviewId: string | null;
}): ReactElement {
  const { driver, reviewId } = props;
  const trimmedReviewId = reviewId?.trim() ?? "";

  if (
    driver.kind === "blocking-finding" &&
    driver.findingId !== undefined &&
    trimmedReviewId.length > 0
  ) {
    return (
      <li>
        <Link
          href={graphFindingDetailHref(trimmedReviewId, driver.findingId)}
          className="text-al-accent-link underline-offset-2 hover:underline"
        >
          {driver.label}
        </Link>
      </li>
    );
  }

  return <li>{driver.label}</li>;
}

export type FeasibilityVerdictDriversPanelProps = {
  readonly drivers: readonly FeasibilityVerdictDriver[];
  /** When null/undefined, drivers cannot be parsed from a transparency trail. */
  readonly transparencyTrail?: TransparencyTrail | null;
  /** When absent (draft admission), blocking-finding drivers render as plain text. */
  readonly reviewId?: string | null;
  readonly className?: string;
  readonly testId?: string;
};

/** TB-2229 — shared “what drove this verdict” panel for run detail and draft admission receipts. */
export function FeasibilityVerdictDriversPanel(props: FeasibilityVerdictDriversPanelProps): ReactElement | null {
  const trail = props.transparencyTrail;

  if (trail === null || trail === undefined) {
    return (
      <div
        className={cn("space-y-2", OPERATOR_TYPOGRAPHY.body, props.className)}
        data-testid={props.testId ?? "feasibility-verdict-drivers"}
      >
        <p className="m-0 font-medium">What drove this verdict</p>
        <p className="m-0 text-al-text-secondary">
          Verdict drivers were not stored because the transparency trail was not returned.
        </p>
      </div>
    );
  }

  if (props.drivers.length === 0) {
    return (
      <div
        className={cn("space-y-2", OPERATOR_TYPOGRAPHY.body, props.className)}
        data-testid={props.testId ?? "feasibility-verdict-drivers"}
      >
        <p className="m-0 font-medium">What drove this verdict</p>
        <p className="m-0 text-al-text-secondary">
          Structured verdict drivers were stored empty on this transparency trail.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body, props.className)}
      data-testid={props.testId ?? "feasibility-verdict-drivers"}
    >
      <p className="m-0 font-medium">What drove this verdict</p>
      {props.drivers.map((driver) => (
        <div key={driver.key}>
          <p className="m-0 text-al-text-secondary">{driverKindLabel(driver.kind)}</p>
          <ul className="mt-1 list-disc pl-5">
            <FeasibilityVerdictDriverRow driver={driver} reviewId={props.reviewId ?? null} />
          </ul>
        </div>
      ))}
    </div>
  );
}
