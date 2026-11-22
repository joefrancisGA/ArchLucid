"use client";

import { cn } from "@/lib/utils";
import { StatusTag, type StatusTagProps } from "@/components/ui/status-tag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ItsmIntegrationHealthResponse } from "@/lib/api/itsm-outbound-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Props = {
  readonly title: string;
  readonly probe: ItsmIntegrationHealthResponse["jira"] | ItsmIntegrationHealthResponse["serviceNow"];
  readonly testId: string;
};

export function ItsmConnectorProbeCard(props: Props): React.ReactElement {
  const summary = (props.probe?.summary ?? "Health probe not available.").trim();
  const configured = props.probe?.locallyConfigured === true;
  const reachable = props.probe?.reachable;

  let statusLabel = props.probe ? "Not configured" : "Health unavailable";
  let statusKind: StatusTagProps["kind"] = "neutral";

  if (configured && reachable === true) {
    statusLabel = "Ready";
    statusKind = "ready";
  } else if (configured && reachable === false) {
    statusLabel = "Connection issue";
    statusKind = "needs-attention";
  } else if (configured) {
    statusLabel = "Configured, not tested";
  }

  return (
    <Card data-testid={props.testId}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{props.title}</CardTitle>
          <StatusTag kind={statusKind} label={statusLabel} />
        </div>
      </CardHeader>
      <CardContent>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{summary}</p>
      </CardContent>
    </Card>
  );
}
