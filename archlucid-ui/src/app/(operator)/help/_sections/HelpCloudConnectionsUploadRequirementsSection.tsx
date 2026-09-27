"use client";

import {
  CLOUD_CONNECTIONS_HELP_UPLOAD_REQUIREMENTS_ID,
  CLOUD_CONNECTIONS_HELP_UPLOAD_REQUIREMENTS_INTRO,
  CLOUD_CONNECTIONS_HELP_UPLOAD_REQUIREMENTS_TITLE,
  cloudConnectionsHelpUploadRequirements,
} from "@/lib/cloud-connections-help-guide-content";
import { OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { cn } from "@/lib/utils";

/** Upload requirements moved from the Extract & upload workspace into dedicated help. */
export function HelpCloudConnectionsUploadRequirementsSection(): React.ReactElement {
  const { productLine } = useProductLine();
  const requirements = cloudConnectionsHelpUploadRequirements(productLine);

  return (
    <section
      id={CLOUD_CONNECTIONS_HELP_UPLOAD_REQUIREMENTS_ID}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "scroll-mt-24")}
      aria-labelledby="help-cloud-connections-upload-requirements-heading"
      data-testid="help-cloud-connections-upload-requirements"
    >
      <h2
        id="help-cloud-connections-upload-requirements-heading"
        className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {CLOUD_CONNECTIONS_HELP_UPLOAD_REQUIREMENTS_TITLE}
      </h2>
      <p className={cn("mt-2 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {CLOUD_CONNECTIONS_HELP_UPLOAD_REQUIREMENTS_INTRO}
      </p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {requirements.map((requirement) => (
          <div key={requirement.label} className="min-w-0">
            <dt className={cn("font-semibold uppercase tracking-wide text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>
              {requirement.label}
            </dt>
            <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {requirement.detail}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
