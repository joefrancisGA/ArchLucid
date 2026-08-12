"use client";

import type { ReactNode } from "react";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO,
  OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_BODY,
  OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import {
  OPERATOR_HOME_ACTION_REFRESH,
  OPERATOR_HOME_ACTION_REFRESHING,
  OPERATOR_HOME_PAGE_TITLE,
} from "@/lib/operator/operator-home-page-copy";
import { useOperatorHomeRefresh } from "@/lib/operator/operator-home-refresh-context";

export type OperatorHomePageHeaderProps = {
  readonly subtitle: string;
};

function operatorHomeSubtitleContent(subtitle: string): ReactNode {
  if (subtitle !== OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO) {
    return subtitle;
  }

  return (
    <>
      <strong className="font-bold text-al-text-primary">
        {OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_LABEL}
      </strong>{" "}
      {OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_BODY}
    </>
  );
}

/** Shared `/` Overview hero — title, lead, contextual help, and refresh (no Last refreshed on this launcher). */
export function OperatorHomePageHeader(props: OperatorHomePageHeaderProps): React.JSX.Element {
  const { refreshing, requestRefresh } = useOperatorHomeRefresh();

  return (
    <OperatorPageHeader
      title={OPERATOR_HOME_PAGE_TITLE}
      titleTestId="operator-home-page-title"
      subtitle={operatorHomeSubtitleContent(props.subtitle)}
      subtitleClassName="max-w-none [&_strong]:font-bold"
      subtitleTestId="operator-home-page-subtitle"
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="operator-home-header-actions">
          <PageContextualHelpButton />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="operator-home-refresh-button"
            disabled={refreshing}
            onClick={() => void requestRefresh()}
          >
            {refreshing ? OPERATOR_HOME_ACTION_REFRESHING : OPERATOR_HOME_ACTION_REFRESH}
          </Button>
        </div>
      }
    />
  );
}
