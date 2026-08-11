"use client";

import Link from "next/link";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { TEAMS_INTEGRATION_SECURITY_NOTE } from "@/lib/teams-integration-page-copy";
import { cn } from "@/lib/utils";

const BEFORE_YOU_CONNECT_STEPS = [
  "Create an incoming webhook for the Teams channel that should receive notifications.",
  "Store the webhook URL in your organization's approved secret store.",
  "Confirm that the ArchLucid delivery identity can read that secret.",
  "Enter the secret name or reference on this page.",
  "Validate the secret, then send a test notification before saving.",
] as const;

type TeamsIntegrationAsideProps = {
  readonly validationMessage: string | null;
  readonly validationKind: "success" | "error" | null;
  readonly testMessage: string | null;
  readonly testKind: "success" | "error" | null;
};

/** Compact setup guidance beside the Teams connection form. */
export function TeamsIntegrationAside(props: TeamsIntegrationAsideProps): React.ReactElement {
  return (
    <aside className="space-y-4" data-testid="teams-integration-aside">
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Security</h2>
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {TEAMS_INTEGRATION_SECURITY_NOTE}
        </p>
      </div>

      <CollapsibleSection title="Before you connect" sectionTestId="teams-before-you-connect">
        <ol className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}>
          {BEFORE_YOU_CONNECT_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </CollapsibleSection>

      {props.validationMessage !== null ? (
        <p
          role={props.validationKind === "error" ? "alert" : "status"}
          className={cn(
            "m-0 rounded-md border px-3 py-2",
            OPERATOR_TYPOGRAPHY.helper,
            props.validationKind === "error"
              ? "border-red-200 text-red-800 dark:border-red-900 dark:text-red-200"
              : "border-teal-200 text-teal-900 dark:border-teal-900 dark:text-teal-100",
          )}
          data-testid="teams-secret-validation-feedback"
        >
          {props.validationMessage}
        </p>
      ) : null}

      {props.testMessage !== null ? (
        <p
          role={props.testKind === "error" ? "alert" : "status"}
          className={cn(
            "m-0 rounded-md border px-3 py-2",
            OPERATOR_TYPOGRAPHY.helper,
            props.testKind === "error"
              ? "border-red-200 text-red-800 dark:border-red-900 dark:text-red-200"
              : "border-teal-200 text-teal-900 dark:border-teal-900 dark:text-teal-100",
          )}
          data-testid="teams-test-feedback"
        >
          {props.testMessage}
        </p>
      ) : null}

      <p className={cn("m-0 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <Link className={OPERATOR_LINK.inline} href={inAppHelpHref("troubleshooting")}>
          Microsoft Teams notification help
        </Link>
        {" · "}
        <Link className={OPERATOR_LINK.inline} href={INTEGRATIONS_READINESS_PATH}>
          Integration readiness
        </Link>
      </p>
    </aside>
  );
}
