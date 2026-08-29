import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReportProblemContext } from "@/lib/report-problem-context";
import {
  REPORT_PROBLEM_API_UI_MISMATCH_HINT,
  REPORT_PROBLEM_DETAILS_SUMMARY_LABEL,
  REPORT_PROBLEM_FIELD_LABEL_API_COMMIT,
  REPORT_PROBLEM_FIELD_LABEL_BROWSER,
  REPORT_PROBLEM_FIELD_LABEL_DEPLOY_STAMP,
  REPORT_PROBLEM_FIELD_LABEL_ENVIRONMENT,
  REPORT_PROBLEM_FIELD_LABEL_ERROR,
  REPORT_PROBLEM_FIELD_LABEL_PRODUCT_VERSION,
  REPORT_PROBLEM_FIELD_LABEL_REFERENCE_ID,
  REPORT_PROBLEM_FIELD_LABEL_REVIEW_ID,
  REPORT_PROBLEM_FIELD_LABEL_ROUTE,
  REPORT_PROBLEM_FIELD_LABEL_UI_COMMIT,
  REPORT_PROBLEM_FIELD_LABEL_WORKSPACE,
  REPORT_PROBLEM_SUMMARY_TITLE,
} from "@/lib/report-problem-copy";

import {
  formatOptionalField,
  formatReportProblemErrorDisplay,
  formatReportProblemProductVersionDisplay,
  hasApiUiCommitMismatch,
  resolveReportProblemReferenceId,
} from "./report-problem-formatters";

export function ReportProblemContextSummary(props: { readonly context: ReportProblemContext }): React.JSX.Element {
  const { context } = props;
  const referenceId = resolveReportProblemReferenceId(context);
  const showMismatchHint = hasApiUiCommitMismatch(context);

  return (
    <div
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="report-problem-context-summary"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
        {REPORT_PROBLEM_SUMMARY_TITLE}
      </p>
      <dl className="m-0 space-y-2">
        <div>
          <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {REPORT_PROBLEM_FIELD_LABEL_REVIEW_ID}
          </dt>
          <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {formatOptionalField(context.reviewId)}
          </dd>
        </div>
        <div>
          <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {REPORT_PROBLEM_FIELD_LABEL_WORKSPACE}
          </dt>
          <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {formatOptionalField(context.workspaceId)}
          </dd>
        </div>
        <div>
          <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {REPORT_PROBLEM_FIELD_LABEL_REFERENCE_ID}
          </dt>
          <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {formatOptionalField(referenceId)}
          </dd>
        </div>
        <div>
          <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {REPORT_PROBLEM_FIELD_LABEL_PRODUCT_VERSION}
          </dt>
          <dd
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="report-problem-product-version"
          >
            {formatReportProblemProductVersionDisplay(context)}
          </dd>
        </div>
      </dl>
      {showMismatchHint ? (
        <p
          className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="report-problem-api-ui-mismatch"
          role="status"
        >
          {REPORT_PROBLEM_API_UI_MISMATCH_HINT}
        </p>
      ) : null}
      <details className="rounded-md border border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-950">
        <summary
          className={cn("cursor-pointer font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="report-problem-details-summary"
        >
          {REPORT_PROBLEM_DETAILS_SUMMARY_LABEL}
        </summary>
        <dl className="m-0 mt-2 space-y-2">
          <div>
            <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {REPORT_PROBLEM_FIELD_LABEL_ROUTE}
            </dt>
            <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {formatOptionalField(context.routePath)}
            </dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {REPORT_PROBLEM_FIELD_LABEL_ERROR}
            </dt>
            <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {formatReportProblemErrorDisplay(context)}
            </dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {REPORT_PROBLEM_FIELD_LABEL_BROWSER}
            </dt>
            <dd className={cn("m-0 break-all text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {formatOptionalField(context.browserClient)}
            </dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {REPORT_PROBLEM_FIELD_LABEL_DEPLOY_STAMP}
            </dt>
            <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {formatOptionalField(context.deployStamp)}
            </dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {REPORT_PROBLEM_FIELD_LABEL_API_COMMIT}
            </dt>
            <dd className={cn("m-0 break-all text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {formatOptionalField(context.apiCommitSha)}
            </dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {REPORT_PROBLEM_FIELD_LABEL_UI_COMMIT}
            </dt>
            <dd className={cn("m-0 break-all text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {formatOptionalField(context.uiCommitSha)}
            </dd>
          </div>
          <div>
            <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {REPORT_PROBLEM_FIELD_LABEL_ENVIRONMENT}
            </dt>
            <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {formatOptionalField(context.environment)}
            </dd>
          </div>
        </dl>
      </details>
    </div>
  );
}
