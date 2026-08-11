"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { OperatorPageBreadcrumb } from "@/components/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

export type HelpTopicMarkdownPrimaryAction = {
  readonly label: string;
  readonly href: string;
  readonly testId: string;
};

export type HelpTopicMarkdownPageHeaderProps = {
  readonly entry: ProductDocumentationEntry;
  readonly showContextualHelp?: boolean;
  readonly showExportClaimDiscipline?: boolean;
  readonly primaryAction?: HelpTopicMarkdownPrimaryAction;
  readonly exportClaimDiscipline?: ReactNode;
  readonly signInFailureTriageLine?: ReactNode;
};

function hasExportActions(props: HelpTopicMarkdownPageHeaderProps): boolean {
  if (props.primaryAction !== undefined) {
    return true;
  }

  if (props.showContextualHelp === true) {
    return true;
  }

  if (props.entry.pdfStatus !== null) {
    return true;
  }

  return false;
}

/** Shared hero for residual `HelpTopicMarkdownView` topics — breadcrumb, provenance, and export actions. */
export function HelpTopicMarkdownPageHeader(props: HelpTopicMarkdownPageHeaderProps): React.JSX.Element {
  const showActions = hasExportActions(props);

  return (
    <OperatorPageHeader
      title={props.entry.title}
      titleTestId="help-topic-page-title"
      subtitle={props.entry.summary}
      breadcrumb={
        <OperatorPageBreadcrumb
          data-testid="help-topic-breadcrumb"
          items={[{ label: "Help", href: "/help" }, { label: props.entry.title }]}
        />
      }
      metadata={
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1" data-testid="help-topic-header-metadata">
          <HelpTopicRegistryProvenanceLine entry={props.entry} />
        </div>
      }
      actions={
        showActions ? (
          <div className="flex flex-wrap items-center gap-2" data-testid="help-topic-export-actions">
            {props.primaryAction !== undefined ? (
              <Button asChild size="sm" variant="primary" data-testid={props.primaryAction.testId}>
                <Link href={props.primaryAction.href}>{props.primaryAction.label}</Link>
              </Button>
            ) : null}
            {props.showContextualHelp === true ? <PageContextualHelpButton /> : null}
            <HelpTopicPrintButton entry={props.entry} />
          </div>
        ) : undefined
      }
      navHref={inAppHelpHref(props.entry.slug)}
      headingLevel="h1"
    >
      {props.signInFailureTriageLine}
      {props.showExportClaimDiscipline === true ? props.exportClaimDiscipline : null}
    </OperatorPageHeader>
  );
}
