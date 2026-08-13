"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
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
  readonly allowWithoutServerPdf?: boolean;
  readonly primaryAction?: HelpTopicMarkdownPrimaryAction;
  readonly exportClaimDiscipline?: ReactNode;
  readonly titleBlockOrientation?: ReactNode;
  readonly signInFailureTriageLine?: ReactNode;
};

function hasExportActions(props: HelpTopicMarkdownPageHeaderProps): boolean {
  if (props.primaryAction !== undefined) {
    return true;
  }

  if (props.entry.pdfStatus !== null) {
    return true;
  }

  if (props.allowWithoutServerPdf === true) {
    return true;
  }

  return false;
}

/** Shared hero for residual `HelpTopicMarkdownView` topics — provenance, orientation, and export actions. */
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
          items={[
            { label: "Help", href: "/help" },
            { label: props.entry.title },
          ]}
        />
      }
      metadata={
        props.titleBlockOrientation !== undefined && props.titleBlockOrientation !== null ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1" data-testid="help-topic-header-metadata">
            {props.titleBlockOrientation}
          </div>
        ) : undefined
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
            <HelpTopicPrintButton entry={props.entry} allowWithoutServerPdf={props.allowWithoutServerPdf} />
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
