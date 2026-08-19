"use client";

import type { JSX } from "react";
import { Brain } from "lucide-react";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { ARCHITECTURE_INTELLIGENCE_PAGE_TITLE } from "@/lib/architecture/architecture-intelligence-page-copy";

export type ArchitectureIntelligencePageHeaderProps = {
  readonly subtitle: string;
};

/** Shared `/architecture/architecture-intelligence` hero — help and buyer-safe subtitle (no breadcrumb trail). */
export function ArchitectureIntelligencePageHeader(
  props: ArchitectureIntelligencePageHeaderProps,
): JSX.Element {
  return (
    <OperatorPageHeader
      navHref={ARCHITECTURE_INTELLIGENCE_PATH}
      icon={Brain}
      title={ARCHITECTURE_INTELLIGENCE_PAGE_TITLE}
      titleTestId="architecture-intelligence-page-title"
      subtitle={props.subtitle}
      actions={
        <div
          className="flex flex-wrap items-center gap-2"
          data-testid="architecture-intelligence-header-actions"
        >
          <PageContextualHelpButton />
        </div>
      }
    />
  );
}
