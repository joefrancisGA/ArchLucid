import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  CLOUD_CONNECTIONS_RECENT_ACTIVITY_TITLE,
  CLOUD_CONNECTIONS_SECURITY_PREFLIGHT_INTRO,
} from "@/lib/cloud-connections-copy";

export type CloudProviderDetailSectionProps = {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
};

export function CloudProviderDetailSection(props: CloudProviderDetailSectionProps) {
  const { id, title, description, children } = props;

  return (
    <section id={id} className="scroll-mt-24 space-y-3" aria-labelledby={`${id}-heading`}>
      <div>
        <h2 id={`${id}-heading`} className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {title}
        </h2>
        {description !== undefined && description.length > 0 ? (
          <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export type CloudProviderDetailLayoutProps = {
  readonly providerLabel: string;
  readonly overview: ReactNode;
  readonly securityPreflight: ReactNode;
  readonly identitySetup: ReactNode;
  readonly connectionDetails: ReactNode;
  readonly validateConnection: ReactNode;
  readonly recentActivity: ReactNode;
  readonly technicalDetails: ReactNode;
};

/** Shared provider detail structure — equal information architecture across Azure, AWS, and GCP. */
export function CloudProviderDetailLayout(props: CloudProviderDetailLayoutProps) {
  return (
    <div className="space-y-4" data-testid={`cloud-provider-detail-${props.providerLabel.toLowerCase()}`}>
      <CloudProviderDetailSection id="overview" title="Overview">
        {props.overview}
      </CloudProviderDetailSection>
      <CloudProviderDetailSection
        id="security-preflight"
        title="Security preflight"
        description={CLOUD_CONNECTIONS_SECURITY_PREFLIGHT_INTRO}
      >
        {props.securityPreflight}
      </CloudProviderDetailSection>
      <CloudProviderDetailSection id="identity-access" title="Identity and access setup">
        {props.identitySetup}
      </CloudProviderDetailSection>
      <CloudProviderDetailSection id="connection-details" title="Connection details">
        {props.connectionDetails}
      </CloudProviderDetailSection>
      <CloudProviderDetailSection id="validate-connection" title="Validate connection">
        {props.validateConnection}
      </CloudProviderDetailSection>
      <CloudProviderDetailSection id="recent-activity" title={CLOUD_CONNECTIONS_RECENT_ACTIVITY_TITLE}>
        {props.recentActivity}
      </CloudProviderDetailSection>
      <CloudProviderDetailSection id="technical-details" title="Technical details">
        {props.technicalDetails}
      </CloudProviderDetailSection>
    </div>
  );
}
