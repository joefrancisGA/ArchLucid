using System.Globalization;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Commands;

/// <summary>Deterministic text/JSON projection for <see cref="RunSupportPacketCommand" /> (unit-tested).</summary>
internal static class RunSupportPacketFormatter
{
    internal static RunSupportPacketPayload BuildPayload(
        string apiBaseUrl,
        string? versionJson,
        ArchLucidApiClient.GetRunResult detail)
    {
        ArgumentNullException.ThrowIfNull(apiBaseUrl);
        ArgumentNullException.ThrowIfNull(detail);

        ArchLucidApiClient.RunInfo run = detail.Run;

        return new RunSupportPacketPayload(
            apiBaseUrl.Trim().TrimEnd('/'),
            run.RunId,
            run.Status.ToString(),
            run.RequestId,
            run.CreatedUtc,
            run.CompletedUtc,
            run.CurrentManifestVersion,
            detail.Results.Count,
            run.OtelTraceId,
            run.RealModeFellBackToSimulator,
            versionJson,
            ResolveNextStep(run.Status, run.CurrentManifestVersion));
    }

    internal static string FormatPlainText(string apiBaseUrl, string? versionJson, ArchLucidApiClient.GetRunResult detail)
    {
        RunSupportPacketPayload p = BuildPayload(apiBaseUrl, versionJson, detail);

        string manifest =
            string.IsNullOrWhiteSpace(p.CurrentManifestVersion) ? "(none — not committed yet)" : p.CurrentManifestVersion;

        string trace = string.IsNullOrWhiteSpace(p.OtelTraceId) ? "(none recorded)" : p.OtelTraceId;

        string simulator =
            p.RealModeFellBackToSimulator is true ? "yes (disclose for sponsor-grade claims)" : "no / unknown";

        string versionOneLine =
            string.IsNullOrWhiteSpace(p.VersionJsonLine) ? "(version endpoint unavailable)" : p.VersionJsonLine.Trim();

        return string.Join(
            Environment.NewLine,
            "ArchLucid run support packet (paste into ticket)",
            "----------------------------------------------",
            $"API base: {p.ApiBaseUrl}",
            $"Run id: {p.RunId}",
            $"Status: {p.Status}",
            $"Request id: {p.RequestId}",
            $"Created (UTC): {p.CreatedUtc:O}",
            $"Completed (UTC): {(p.CompletedUtc is null ? "(pending)" : p.CompletedUtc.Value.ToString("O", CultureInfo.InvariantCulture))}",
            $"Manifest version: {manifest}",
            $"Submitted agent results (count): {p.SubmittedAgentResultsCount}",
            $"OpenTelemetry trace id: {trace}",
            $"Simulator substitution recorded: {simulator}",
            $"Host version (GET /version JSON, one line): {versionOneLine}",
            $"Next step: {p.NextStepHint}",
            "",
            $"CLI: archlucid trace {p.RunId}   # trace viewer URL / raw id",
            $"CLI: archlucid status {p.RunId}",
            $"CLI: archlucid first-value-report {p.RunId} --save",
            $"HTTP: GET {p.ApiBaseUrl}/v1/architecture/run/{p.RunId}");
    }

    internal static string ResolveNextStep(ArchitectureRunStatus status, string? manifestVersion)
    {
        if (!string.IsNullOrWhiteSpace(manifestVersion))
            return "Committed — attach sponsor Markdown (`archlucid first-value-report <runId> --save`) or `reference-evidence` before escalation.";

        return status switch
        {
            ArchitectureRunStatus.ReadyForCommit =>
                "Ready for commit — run `archlucid commit <runId>` (legacy coordinator path) or confirm authority pipeline status via `GET /v1/architecture/run/{runId}` before retrying.",
            ArchitectureRunStatus.WaitingForResults or ArchitectureRunStatus.TasksGenerated =>
                "Legacy coordinator path — submit pending agent results; do not call execute if authority pipeline already committed (see API_CONTRACTS § authority vs coordinator).",
            ArchitectureRunStatus.Failed =>
                "Run failed — inspect operator UI / API logs; run `archlucid doctor` for host readiness.",
            ArchitectureRunStatus.Retrying =>
                "Retry in progress — poll `archlucid status <runId>` until status stabilizes.",
            _ =>
                "Inspect `GET /v1/architecture/run/{runId}` first — authority pipeline runs on SQL after create; execute/commit only when legacy coordinator tasks are required (see ARCHITECTURE_FLOWS Flow A1)."
        };
    }
}
