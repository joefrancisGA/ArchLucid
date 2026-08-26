using ArchLucid.Cli;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Commands;

internal sealed partial class ShipGateEvidenceRunner
{
    private async Task<ShipGateEvidenceGateResult> BuildGate4Async(
        string runId,
        bool skipClaimLint,
        CancellationToken cancellationToken)
    {
        try
        {
            ShipGateExportMatrixContract contract = ShipGateExportMatrixContractLoader.Load(null);
            IReadOnlyList<ShipGateExportMatrixProbeResult> probeResults =
                await ShipGateExportMatrixProbe.ProbeAsync(_http, runId, contract, cancellationToken);

            int passCount = probeResults.Count(static result => result.Success);
            int failCount = probeResults.Count - passCount;
            string failedSummary = string.Join(
                "; ",
                probeResults
                    .Where(static result => !result.Success)
                    .Select(static result => $"{result.ProbeId}({result.Format})={result.Detail}"));

            bool exportMatrixPass = failCount == 0;
            ShipGateFirstValueClaimLintResult claimLintResult = exportMatrixPass
                ? await ShipGateFirstValueClaimLintProbe.EvaluateAsync(_http, runId, skipClaimLint, cancellationToken)
                : new ShipGateFirstValueClaimLintResult
                {
                    Skipped = true,
                    ViolationCount = 0,
                    Detail = "claimLint=not-evaluated (export matrix failed)",
                };

            ShipGateEvidenceVerdict verdict = exportMatrixPass && claimLintResult.Success
                ? ShipGateEvidenceVerdict.Pass
                : ShipGateEvidenceVerdict.Fail;

            return new ShipGateEvidenceGateResult
            {
                GateNumber = 4,
                Name = "Export/package generation works (Markdown / DOCX / ZIP)",
                Verdict = verdict,
                Evidence =
                    $"exportMatrixPassed={passCount}/{probeResults.Count}; formats=markdown,docx,zip,traceability-zip; contractProbes={contract.Probes.Count}; failed=[{failedSummary}]; {claimLintResult.Detail}.",
                FastestResolution = verdict == ShipGateEvidenceVerdict.Pass
                    ? null
                    : exportMatrixPass
                        ? "Remove unsupported buyer-facing claims from first-value-report markdown (see proof_packet_claim_lint_rules.v1.json) or fix API source content, then rerun ship-gate evidence."
                        : "Verify committed-run export routes (first-value Markdown, analysis DOCX, run export ZIP) for the supplied runId and rerun ship-gate evidence.",
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or IOException or InvalidOperationException)
        {
            return new ShipGateEvidenceGateResult
            {
                GateNumber = 4,
                Name = "Export/package generation works (Markdown / DOCX / ZIP)",
                Verdict = ShipGateEvidenceVerdict.Fail,
                Evidence = $"Export matrix probe failed: {ex.Message}",
                FastestResolution = "Confirm API connectivity and bundled ship_gate_export_matrix_contract.v1.json, then rerun ship-gate evidence.",
            };
        }
    }

    private async Task<ShipGateEvidenceGateResult> BuildGate5Async(
        string runId,
        string? uiBaseUrl,
        string? uiBaseUrlSource,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(uiBaseUrl))
        {
            string skipDetail = string.Equals(
                uiBaseUrlSource,
                ShipGateUiBaseUrlResolution.SkippedSource,
                StringComparison.Ordinal)
                ? "--skip-ui-route-smoke supplied"
                : "No UI origin resolved";

            return new ShipGateEvidenceGateResult
            {
                GateNumber = 5,
                Name = "Operator UI does not break during first-review / demo path",
                Verdict = ShipGateEvidenceVerdict.Unknown,
                Evidence =
                    $"{skipDetail}; omit --skip-ui-route-smoke to probe canonical routes (ARCHLUCID_UI_BASE_URL, archlucid.json uiUrl, or --ui-base-url).",
                FastestResolution =
                    "Rerun without --skip-ui-route-smoke while the operator UI is reachable, or attach Playwright first-review smoke output separately.",
            };
        }

        try
        {
            FirstReviewUiRouteSmokeContract contract = FirstReviewUiRouteSmokeContractLoader.Load(null);
            using HttpClient uiHttp = FirstReviewUiRouteSmokeProbe.CreateUiClient(uiBaseUrl);
            IReadOnlyList<FirstReviewUiRouteSmokeProbeResult> probeResults =
                await FirstReviewUiRouteSmokeProbe.ProbeAsync(uiHttp, runId, contract, cancellationToken);

            int passCount = probeResults.Count(static result => result.Success);
            int failCount = probeResults.Count - passCount;
            string failedSummary = string.Join(
                "; ",
                probeResults
                    .Where(static result => !result.Success)
                    .Select(static result => $"{result.RouteId}={result.Detail}"));

            ShipGateEvidenceVerdict verdict = failCount == 0
                ? ShipGateEvidenceVerdict.Pass
                : ShipGateEvidenceVerdict.Fail;

            string originLabel = string.IsNullOrWhiteSpace(uiBaseUrlSource) ? "unspecified" : uiBaseUrlSource;

            return new ShipGateEvidenceGateResult
            {
                GateNumber = 5,
                Name = "Operator UI does not break during first-review / demo path",
                Verdict = verdict,
                Evidence =
                    $"uiBaseUrl={uiBaseUrl.Trim().TrimEnd('/')}; uiOrigin={originLabel}; routesPassed={passCount}/{probeResults.Count}; contractRoutes={contract.Routes.Count}; failed=[{failedSummary}].",
                FastestResolution = verdict == ShipGateEvidenceVerdict.Pass
                    ? "Browser rendering and auth/session flows still require Playwright smoke for full PASS."
                    : "Fix failing operator routes or UI deployment before sponsor/demo; rerun ship-gate evidence with the same UI origin.",
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or IOException or InvalidOperationException)
        {
            return new ShipGateEvidenceGateResult
            {
                GateNumber = 5,
                Name = "Operator UI does not break during first-review / demo path",
                Verdict = ShipGateEvidenceVerdict.Fail,
                Evidence = $"First-review UI route smoke failed: {ex.Message}",
                FastestResolution = "Confirm the operator UI is running at --ui-base-url and bundled first_review_ui_route_smoke_contract.v1.json is present.",
            };
        }
    }

    private async Task<ShipGateEvidenceGateResult> BuildGate6Async(
        string runId,
        TenantIsolationNegativeTestOptions? tenantIsolationOptions,
        CancellationToken cancellationToken)
    {
        TenantIsolationNegativeTestOptions isolationOptions = tenantIsolationOptions ?? new TenantIsolationNegativeTestOptions { RunId = runId };

        if (string.IsNullOrWhiteSpace(isolationOptions.RunId))
        {
            isolationOptions = new TenantIsolationNegativeTestOptions
            {
                RunId = runId,
                AlternateTenantId = isolationOptions.AlternateTenantId,
                AlternateWorkspaceId = isolationOptions.AlternateWorkspaceId,
                AlternateProjectId = isolationOptions.AlternateProjectId,
            };
        }

        string baseUrl = (_http.BaseAddress?.ToString() ?? string.Empty).Trim().TrimEnd('/');

        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            return new ShipGateEvidenceGateResult
            {
                GateNumber = 6,
                Name = "Auth + tenant isolation behave correctly on the pilot path",
                Verdict = ShipGateEvidenceVerdict.Unknown,
                Evidence = "Tenant-isolation probe skipped: API base URL is missing on the primary HttpClient.",
                FastestResolution = "Configure --api-base-url or archlucid.json api.baseUrl before running ship-gate evidence.",
            };
        }

        try
        {
            using HttpClient alternateClient = CreateAlternateScopeClient(baseUrl, isolationOptions);
            TenantIsolationNegativeTestRunner runner = new();
            string repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot() ?? Environment.CurrentDirectory;

            TenantIsolationNegativeTestReport report = await runner.RunLiveAsync(
                repositoryRoot,
                _http,
                alternateClient,
                isolationOptions,
                cancellationToken);

            ShipGateEvidenceVerdict verdict = MapTenantIsolationVerdict(report.OverallVerdict);
            int failCount = report.UnexpectedSuccessCount;
            int probeCount = report.Probes.Count;

            return new ShipGateEvidenceGateResult
            {
                GateNumber = 6,
                Name = "Auth + tenant isolation behave correctly on the pilot path",
                Verdict = verdict,
                Evidence =
                    $"tenant-isolation verdict={report.OverallVerdict}; probes={probeCount}; unexpectedSuccess={failCount}; alternateTenant={report.AlternateTenantId}; standalone: archlucid pilot tenant-isolation-negative-test --run-id {runId}.",
                FastestResolution = verdict == ShipGateEvidenceVerdict.Pass
                    ? "Live two-tenant SQL smoke remains the fastest full-environment proof beyond structural deny-matrix probes."
                    : "Investigate cross-tenant probe failures or confirm the representative runId is visible under primary scope, then rerun ship-gate evidence.",
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or IOException or InvalidOperationException)
        {
            return new ShipGateEvidenceGateResult
            {
                GateNumber = 6,
                Name = "Auth + tenant isolation behave correctly on the pilot path",
                Verdict = ShipGateEvidenceVerdict.Fail,
                Evidence = $"Tenant-isolation probe failed: {ex.Message}",
                FastestResolution = "Confirm API connectivity and alternate tenant scope headers, then rerun ship-gate evidence.",
            };
        }
    }

    private HttpClient CreateAlternateScopeClient(string baseUrl, TenantIsolationNegativeTestOptions options)
    {
        if (_alternateScopeClientFactory is not null)
            return _alternateScopeClientFactory();

        HttpClient alternateClient = CliAuthorizedHttpClient.Create(baseUrl, _config);
        (string tenantId, string workspaceId, string projectId) = TenantIsolationNegativeTestRunner.ResolveAlternateScope(options);
        CliScopeHeaders.ApplyExplicit(alternateClient, tenantId, workspaceId, projectId);

        return alternateClient;
    }

    private static ShipGateEvidenceVerdict MapTenantIsolationVerdict(TenantIsolationNegativeTestVerdict isolationVerdict) =>
        isolationVerdict switch
        {
            TenantIsolationNegativeTestVerdict.Fail => ShipGateEvidenceVerdict.Fail,
            TenantIsolationNegativeTestVerdict.Pass => ShipGateEvidenceVerdict.Pass,
            TenantIsolationNegativeTestVerdict.Skip => ShipGateEvidenceVerdict.Unknown,
            _ => ShipGateEvidenceVerdict.Unknown,
        };


    private static string Trim(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "(empty)";

        string singleLine = value.Replace(Environment.NewLine, " ", StringComparison.Ordinal);

        return singleLine.Length <= 240 ? singleLine : singleLine[..240] + "…";
    }
}
