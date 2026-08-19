"use client";

import { AppInsightsTelemetryInit } from "@/components/AppInsightsTelemetryInit";
import { ClientRuntimeDiagnostics } from "@/components/ClientRuntimeDiagnostics";
import { OperatorRouteEnteredTelemetry } from "@/components/operator/OperatorRouteEnteredTelemetry";

/** Non-blocking telemetry init cluster — deferred off hub First Load JS (TB-2118). */
export function AppShellTelemetryBundle(): React.JSX.Element {
  return (
    <>
      <AppInsightsTelemetryInit />
      <ClientRuntimeDiagnostics />
      <OperatorRouteEnteredTelemetry />
    </>
  );
}
