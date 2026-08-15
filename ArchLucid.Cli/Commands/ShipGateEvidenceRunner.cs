using System.Net;
using System.Text.Json;

using ArchLucid.Cli;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Commands;

internal sealed class ShipGateEvidenceRunner(
    HttpClient http,
    ArchLucidProjectScaffolder.ArchLucidCliConfig? config = null,
    Func<HttpClient>? alternateScopeClientFactory = null)
{
    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));
    private readonly ArchLucidProjectScaffolder.ArchLucidCliConfig? _config = config;
    private readonly Func<HttpClient>? _alternateScopeClientFactory = alternateScopeClientFactory;

    public async Task<ShipGateEvidenceReport> RunAsync(
        string runId,
        string? uiBaseUrl = null,
        string? uiBaseUrlSource = null,
        TenantIsolationNegativeTestOptions? tenantIsolationOptions = null,
        bool skipClaimLint = false,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        RunDetailProbe? runProbe = await TryFetchRunDetailProbeAsync(runId, cancellationToken);

        ShipGateEvidenceGateResult gate1 = await BuildGate1Async(runId, runProbe, cancellationToken);
        ShipGateEvidenceGateResult gate2 = await BuildGate2Async(runId, cancellationToken);
        ShipGateEvidenceGateResult gate3 = await BuildGate3Async(cancellationToken);
        ShipGateEvidenceGateResult gate4 = await BuildGate4Async(runId, skipClaimLint, cancellationToken);
        ShipGateEvidenceGateResult gate5 = await BuildGate5Async(runId, uiBaseUrl, uiBaseUrlSource, cancellationToken);
        ShipGateEvidenceGateResult gate6 = await BuildGate6Async(runId, tenantIsolationOptions, cancellationToken);

        return new ShipGateEvidenceReport
        {
            BaseUrl = (_http.BaseAddress?.ToString() ?? string.Empty).Trim().TrimEnd('/'),
            RunId = runId,
            UiBaseUrl = string.IsNullOrWhiteSpace(uiBaseUrl) ? null : uiBaseUrl.Trim().TrimEnd('/'),
            UiBaseUrlSource = string.IsNullOrWhiteSpace(uiBaseUrlSource) ? null : uiBaseUrlSource,
            GeneratedUtc = DateTime.UtcNow,
            Gates = [gate1, gate2, gate3, gate4, gate5, gate6],
        };
    }

    private async Task<ShipGateEvidenceGateResult> BuildGate1Async(
        string runId,
        RunDetailProbe? runProbe,
        CancellationToken cancellationToken)
    {
        try
        {
            FirstReviewCompletionContract contract = FirstReviewCompletionContractLoader.Load(null);
            FirstReviewCompletionRunSnapshot? snapshot = runProbe is null
                ? null
                : new FirstReviewCompletionRunSnapshot
                {
                    StatusRaw = runProbe.StatusRaw,
                    CurrentManifestVersion = runProbe.CurrentManifestVersion,
                    RequestId = runProbe.RequestId,
                    HasCompletedUtc = runProbe.HasCompletedUtc,
                    TaskCount = runProbe.TaskCount,
                    ResultCount = runProbe.ResultCount,
                };

            IReadOnlyList<FirstReviewCompletionProbeResult> probeResults =
                await FirstReviewCompletionProbe.EvaluateAsync(_http, runId, snapshot, contract, cancellationToken);

            int passCount = probeResults.Count(static result => result.Success);
            int failCount = probeResults.Count - passCount;
            string failedSummary = string.Join(
                "; ",
                probeResults
                    .Where(static result => !result.Success)
                    .Select(static result => $"{result.SignalId}={result.Detail}"));

            ShipGateEvidenceVerdict verdict = failCount == 0
                ? ShipGateEvidenceVerdict.Pass
                : ShipGateEvidenceVerdict.Fail;

            return new ShipGateEvidenceGateResult
            {
                GateNumber = 1,
                Name = "First review completes end to end (create -> execute -> commit -> manifest + artifact)",
                Verdict = verdict,
                Evidence =
                    $"completionSignalsPassed={passCount}/{probeResults.Count}; contractSignals={contract.RunDetailSignals.Count + contract.LiveProbes.Count}; failed=[{failedSummary}].",
                FastestResolution = verdict == ShipGateEvidenceVerdict.Pass
                    ? "Live scripted create->execute->commit in a fresh tenant remains the fastest full-environment proof beyond structural completion probes."
                    : "Run one representative first-review path through create, execute, and commit until all Gate 1 completion signals pass, then rerun ship-gate evidence.",
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or IOException or InvalidOperationException)
        {
            return new ShipGateEvidenceGateResult
            {
                GateNumber = 1,
                Name = "First review completes end to end (create -> execute -> commit -> manifest + artifact)",
                Verdict = ShipGateEvidenceVerdict.Fail,
                Evidence = $"First-review completion probe failed: {ex.Message}",
                FastestResolution = "Confirm API connectivity and bundled first_review_completion_contract.v1.json, then rerun ship-gate evidence.",
            };
        }
    }

    private async Task<RunDetailProbe?> TryFetchRunDetailProbeAsync(string runId, CancellationToken cancellationToken)
    {
        try
        {
            using HttpResponseMessage response = await _http.GetAsync($"/v1/architecture/review/{runId}", cancellationToken);

            if (response.StatusCode != HttpStatusCode.OK)
                return null;

            string body = await response.Content.ReadAsStringAsync(cancellationToken);
            using JsonDocument doc = JsonDocument.Parse(body);
            JsonElement root = doc.RootElement;

            if (!root.TryGetProperty("run", out JsonElement run) || run.ValueKind != JsonValueKind.Object)
                return null;

            string statusRaw = ReadStatusRaw(run);
            string? manifestVersion = run.TryGetProperty("currentManifestVersion", out JsonElement manifestEl)
                ? manifestEl.GetString()
                : null;
            string? requestId = run.TryGetProperty("requestId", out JsonElement requestEl)
                ? requestEl.GetString()
                : null;
            bool hasCompletedUtc = run.TryGetProperty("completedUtc", out JsonElement completedEl)
                && completedEl.ValueKind != JsonValueKind.Null;

            int taskCount = root.TryGetProperty("tasks", out JsonElement tasks) && tasks.ValueKind == JsonValueKind.Array
                ? tasks.GetArrayLength()
                : 0;
            int resultCount = root.TryGetProperty("results", out JsonElement results) && results.ValueKind == JsonValueKind.Array
                ? results.GetArrayLength()
                : 0;

            return new RunDetailProbe(statusRaw, manifestVersion, requestId, hasCompletedUtc, taskCount, resultCount);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            return null;
        }
    }


    private static string ReadStatusRaw(JsonElement run)
    {
        if (!run.TryGetProperty("status", out JsonElement statusEl))
            return "(missing)";

        return statusEl.ValueKind switch
        {
            JsonValueKind.String => statusEl.GetString() ?? "(null)",
            JsonValueKind.Number => statusEl.GetRawText(),
            _ => statusEl.ToString(),
        };
    }

    private static bool IsCommittedStatus(string statusRaw) =>
        string.Equals(statusRaw, "Committed", StringComparison.OrdinalIgnoreCase)
        || string.Equals(statusRaw, "5", StringComparison.Ordinal);

    private sealed record RunDetailProbe(
        string StatusRaw,
        string? CurrentManifestVersion,
        string? RequestId,
        bool HasCompletedUtc,
        int TaskCount,
        int ResultCount)
    {
        public bool IsCommitted => IsCommittedStatus(StatusRaw);
    }

    private async Task<ShipGateEvidenceGateResult> BuildGate2Async(string runId, CancellationToken cancellationToken)
    {
        try
        {
            CitationIntegrityRunBundle? bundle = await CitationIntegrityApiLoader.TryLoadRunBundleAsync(
                _http,
                runId,
                cancellationToken);

            if (bundle is null)
            {
                return new ShipGateEvidenceGateResult
                {
                    GateNumber = 2,
                    Name = "Representative review has no hallucinated or uncited policy/evidence citations",
                    Verdict = ShipGateEvidenceVerdict.Fail,
                    Evidence = "Citation-integrity probe could not load GET /v1/architecture/review/{runId} for the supplied run.",
                    FastestResolution =
                        "Verify runId, API auth, and run detail availability; rerun ship-gate evidence with a committed representative run.",
                };
            }

            if (bundle.Status != ArchitectureRunStatus.Committed)
            {
                return new ShipGateEvidenceGateResult
                {
                    GateNumber = 2,
                    Name = "Representative review has no hallucinated or uncited policy/evidence citations",
                    Verdict = ShipGateEvidenceVerdict.Fail,
                    Evidence = $"Citation-integrity requires a committed run; observed status={bundle.Status}.",
                    FastestResolution = "Commit the representative run before asserting citation integrity in ship-gate evidence.",
                };
            }

            CitationIntegrityRules rules = CitationIntegrityRulesLoader.Load(null);
            CitationIntegrityRunResult citationResult = CitationIntegrityEvaluator.EvaluateRun(bundle, rules);
            ShipGateEvidenceVerdict verdict = MapCitationVerdict(citationResult.Verdict);
            int failCount = citationResult.Issues.Count(static issue => issue.Verdict == CitationIntegrityVerdict.Fail);
            int warnCount = citationResult.Issues.Count(static issue => issue.Verdict == CitationIntegrityVerdict.Warn);

            return new ShipGateEvidenceGateResult
            {
                GateNumber = 2,
                Name = "Representative review has no hallucinated or uncited policy/evidence citations",
                Verdict = verdict,
                Evidence =
                    $"citation-integrity verdict={citationResult.Verdict}; failIssues={failCount}; warnIssues={warnCount}; agentResults={citationResult.AgentResultCount}; standalone: archlucid pilot citation-integrity --include-api.",
                FastestResolution = verdict == ShipGateEvidenceVerdict.Pass
                    ? warnCount > 0
                        ? "Review WARN-level citation gaps before sponsor send; semantic hallucination audit remains manual."
                        : null
                    : "Fix missing/weak citations on the representative run or rerun citation-integrity with fixture replay to triage failing claim classes.",
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or IOException or InvalidOperationException)
        {
            return new ShipGateEvidenceGateResult
            {
                GateNumber = 2,
                Name = "Representative review has no hallucinated or uncited policy/evidence citations",
                Verdict = ShipGateEvidenceVerdict.Fail,
                Evidence = $"Citation-integrity probe failed: {ex.Message}",
                FastestResolution = "Confirm API connectivity and bundled citation_integrity_rules.v1.json, then rerun ship-gate evidence.",
            };
        }
    }

    private static ShipGateEvidenceVerdict MapCitationVerdict(CitationIntegrityVerdict citationVerdict) =>
        citationVerdict switch
        {
            CitationIntegrityVerdict.Fail => ShipGateEvidenceVerdict.Fail,
            CitationIntegrityVerdict.Pass or CitationIntegrityVerdict.Warn => ShipGateEvidenceVerdict.Pass,
            _ => ShipGateEvidenceVerdict.Unknown,
        };

    private async Task<ShipGateEvidenceGateResult> BuildGate3Async(CancellationToken cancellationToken)
    {
        try
        {
            IReadOnlyList<ShipGateRoiCoherenceProbeResult> probeResults =
                await ShipGateRoiCoherenceProbe.EvaluateAsync(_http, cancellationToken);

            int passCount = probeResults.Count(static result => result.Success);
            int failCount = probeResults.Count - passCount;
            string failedSummary = string.Join(
                "; ",
                probeResults
                    .Where(static result => !result.Success)
                    .Select(static result => $"{result.SignalId}={result.Detail}"));

            ShipGateEvidenceVerdict verdict = failCount == 0
                ? ShipGateEvidenceVerdict.Pass
                : ShipGateEvidenceVerdict.Fail;

            return new ShipGateEvidenceGateResult
            {
                GateNumber = 3,
                Name = "Sponsor report / ROI output coherent and not misleading",
                Verdict = verdict,
                Evidence =
                    $"roiCoherenceSignalsPassed={passCount}/{probeResults.Count}; contractSignals={probeResults.Count}; failed=[{failedSummary}].",
                FastestResolution = verdict == ShipGateEvidenceVerdict.Pass
                    ? null
                    : "Verify sponsor ROI payload includes disposition-aware scope labels, basisBreakdown buckets, and headline math (open+needsEvidence) on GET /v1/roi/sponsor-report, then rerun ship-gate evidence.",
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or InvalidOperationException)
        {
            return new ShipGateEvidenceGateResult
            {
                GateNumber = 3,
                Name = "Sponsor report / ROI output coherent and not misleading",
                Verdict = ShipGateEvidenceVerdict.Fail,
                Evidence = ex.Message,
                FastestResolution = "Confirm API connectivity/auth and rerun ship-gate evidence.",
            };
        }
    }

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
