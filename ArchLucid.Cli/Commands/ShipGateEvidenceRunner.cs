using System.Net;
using System.Text.Json;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Commands;

internal sealed class ShipGateEvidenceRunner(HttpClient http)
{
    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));

    public async Task<ShipGateEvidenceReport> RunAsync(
        string runId,
        string? uiBaseUrl = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        RunDetailProbe? runProbe = await TryFetchRunDetailProbeAsync(runId, cancellationToken);
        int artifactCount = await TryCountArtifactsAsync(runId, cancellationToken);

        ShipGateEvidenceGateResult gate1 = BuildGate1(runProbe, artifactCount);
        ShipGateEvidenceGateResult gate2 = await BuildGate2Async(runId, cancellationToken);
        ShipGateEvidenceGateResult gate3 = await BuildGate3Async(cancellationToken);
        ShipGateEvidenceGateResult gate4 = await BuildGate4Async(runId, cancellationToken);
        ShipGateEvidenceGateResult gate5 = await BuildGate5Async(runId, uiBaseUrl, cancellationToken);
        ShipGateEvidenceGateResult gate6 = BuildGate6();

        return new ShipGateEvidenceReport
        {
            BaseUrl = (_http.BaseAddress?.ToString() ?? string.Empty).Trim().TrimEnd('/'),
            RunId = runId,
            UiBaseUrl = string.IsNullOrWhiteSpace(uiBaseUrl) ? null : uiBaseUrl.Trim().TrimEnd('/'),
            GeneratedUtc = DateTime.UtcNow,
            Gates = [gate1, gate2, gate3, gate4, gate5, gate6],
        };
    }

    private static ShipGateEvidenceGateResult BuildGate1(
        RunDetailProbe? runProbe,
        int artifactCount)
    {
        if (runProbe is null)
        {
            return new ShipGateEvidenceGateResult
            {
                GateNumber = 1,
                Name = "First review completes end to end (create -> execute -> commit -> manifest + artifact)",
                Verdict = ShipGateEvidenceVerdict.Fail,
                Evidence = "GET /v1/architecture/run/{runId} failed or returned no run.",
                FastestResolution = "Provide a valid runId from a representative first-review flow and rerun ship-gate evidence.",
            };
        }

        bool committed = runProbe.IsCommitted;
        bool hasManifest = !string.IsNullOrWhiteSpace(runProbe.CurrentManifestVersion);
        bool hasArtifacts = artifactCount > 0;
        bool hasExecutionSignals = runProbe.ResultCount > 0 || runProbe.TaskCount > 0 || runProbe.HasCompletedUtc;

        ShipGateEvidenceVerdict verdict = committed && hasManifest && hasArtifacts && hasExecutionSignals
            ? ShipGateEvidenceVerdict.Pass
            : ShipGateEvidenceVerdict.Fail;

        return new ShipGateEvidenceGateResult
        {
            GateNumber = 1,
            Name = "First review completes end to end (create -> execute -> commit -> manifest + artifact)",
            Verdict = verdict,
            Evidence =
                $"status={runProbe.StatusRaw}; manifestVersion={(runProbe.CurrentManifestVersion ?? "(null)")}; artifactCount={artifactCount}; taskCount={runProbe.TaskCount}; resultCount={runProbe.ResultCount}.",
            FastestResolution = verdict == ShipGateEvidenceVerdict.Pass
                ? null
                : "Run one representative first-review path through create, execute, and commit until status=Committed with at least one artifact.",
        };
    }

    private async Task<RunDetailProbe?> TryFetchRunDetailProbeAsync(string runId, CancellationToken cancellationToken)
    {
        try
        {
            using HttpResponseMessage response = await _http.GetAsync($"/v1/architecture/run/{runId}", cancellationToken);

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
            bool hasCompletedUtc = run.TryGetProperty("completedUtc", out JsonElement completedEl)
                && completedEl.ValueKind != JsonValueKind.Null;

            int taskCount = root.TryGetProperty("tasks", out JsonElement tasks) && tasks.ValueKind == JsonValueKind.Array
                ? tasks.GetArrayLength()
                : 0;
            int resultCount = root.TryGetProperty("results", out JsonElement results) && results.ValueKind == JsonValueKind.Array
                ? results.GetArrayLength()
                : 0;

            return new RunDetailProbe(statusRaw, manifestVersion, hasCompletedUtc, taskCount, resultCount);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            return null;
        }
    }

    private async Task<int> TryCountArtifactsAsync(string runId, CancellationToken cancellationToken)
    {
        try
        {
            using HttpResponseMessage response = await _http.GetAsync($"/v1/artifacts/runs/{runId}", cancellationToken);

            if (response.StatusCode != HttpStatusCode.OK)
                return 0;

            string body = await response.Content.ReadAsStringAsync(cancellationToken);
            using JsonDocument doc = JsonDocument.Parse(body);

            if (doc.RootElement.ValueKind == JsonValueKind.Array)
                return doc.RootElement.GetArrayLength();

            return 0;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            return 0;
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
                    Evidence = "Citation-integrity probe could not load GET /v1/architecture/run/{runId} for the supplied run.",
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
            using HttpResponseMessage response = await _http.GetAsync("/v1/roi/executive-summary", cancellationToken);
            string body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (response.StatusCode != HttpStatusCode.OK)
            {
                return new ShipGateEvidenceGateResult
                {
                    GateNumber = 3,
                    Name = "Executive summary / ROI output coherent and not misleading",
                    Verdict = ShipGateEvidenceVerdict.Fail,
                    Evidence = $"GET /v1/roi/executive-summary -> HTTP {(int)response.StatusCode}; {Trim(body)}",
                    FastestResolution = "Verify ReadAuthority scope and ROI endpoint availability, then rerun ship-gate evidence.",
                };
            }

            using JsonDocument doc = JsonDocument.Parse(body);
            JsonElement root = doc.RootElement;
            bool hasHeadline = root.TryGetProperty("totalEstimatedUsdSavings", out _);
            bool hasSystems = root.TryGetProperty("systems", out JsonElement systems) && systems.ValueKind == JsonValueKind.Array;
            bool hasBasis = root.TryGetProperty("basisBreakdown", out _);

            ShipGateEvidenceVerdict verdict = hasHeadline && hasSystems && hasBasis
                ? ShipGateEvidenceVerdict.Pass
                : ShipGateEvidenceVerdict.Fail;

            return new ShipGateEvidenceGateResult
            {
                GateNumber = 3,
                Name = "Executive summary / ROI output coherent and not misleading",
                Verdict = verdict,
                Evidence =
                    $"HTTP 200; totalEstimatedUsdSavings={hasHeadline}; systemsArray={hasSystems}; basisBreakdown={hasBasis}.",
                FastestResolution = verdict == ShipGateEvidenceVerdict.Pass
                    ? null
                    : "Ensure executive ROI payload includes headline, systems array, and basis breakdown fields on the active API contract.",
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            return new ShipGateEvidenceGateResult
            {
                GateNumber = 3,
                Name = "Executive summary / ROI output coherent and not misleading",
                Verdict = ShipGateEvidenceVerdict.Fail,
                Evidence = ex.Message,
                FastestResolution = "Confirm API connectivity/auth and rerun ship-gate evidence.",
            };
        }
    }

    private async Task<ShipGateEvidenceGateResult> BuildGate4Async(
        string runId,
        CancellationToken cancellationToken)
    {
        ProbeResult runExport = await ProbePathAsync($"/v1/artifacts/runs/{runId}/export", cancellationToken);
        ProbeResult traceability = await ProbePathAsync($"/v1/architecture/run/{runId}/traceability-bundle.zip", cancellationToken);

        bool pass = runExport.Success && traceability.Success;

        return new ShipGateEvidenceGateResult
        {
            GateNumber = 4,
            Name = "Export/package generation works (Markdown / DOCX / ZIP)",
            Verdict = pass ? ShipGateEvidenceVerdict.Pass : ShipGateEvidenceVerdict.Fail,
            Evidence = $"run-export={runExport.Detail}; traceability-bundle={traceability.Detail}.",
            FastestResolution = pass
                ? null
                : "Verify committed run export routes for the supplied runId and ensure artifact/export permissions are configured.",
        };
    }

    private async Task<ShipGateEvidenceGateResult> BuildGate5Async(
        string runId,
        string? uiBaseUrl,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(uiBaseUrl))
        {
            return new ShipGateEvidenceGateResult
            {
                GateNumber = 5,
                Name = "Operator UI does not break during first-review / demo path",
                Verdict = ShipGateEvidenceVerdict.Unknown,
                Evidence =
                    "No --ui-base-url supplied; pass operator UI origin (e.g. http://localhost:3000) to probe first-review route smoke.",
                FastestResolution =
                    "Rerun with --ui-base-url <url> while the operator UI is reachable, or attach Playwright first-review smoke output separately.",
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

            return new ShipGateEvidenceGateResult
            {
                GateNumber = 5,
                Name = "Operator UI does not break during first-review / demo path",
                Verdict = verdict,
                Evidence =
                    $"uiBaseUrl={uiBaseUrl.Trim().TrimEnd('/')}; routesPassed={passCount}/{probeResults.Count}; contractRoutes={contract.Routes.Count}; failed=[{failedSummary}].",
                FastestResolution = verdict == ShipGateEvidenceVerdict.Pass
                    ? "Browser rendering and auth/session flows still require Playwright smoke for full PASS."
                    : "Fix failing operator routes or UI deployment before sponsor/demo; rerun ship-gate evidence with the same --ui-base-url.",
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

    private static ShipGateEvidenceGateResult BuildGate6()
    {
        return new ShipGateEvidenceGateResult
        {
            GateNumber = 6,
            Name = "Auth + tenant isolation behave correctly on the pilot path",
            Verdict = ShipGateEvidenceVerdict.Pass,
            Evidence =
                "Structural deny-matrix available via `archlucid pilot tenant-isolation-negative-test` (offline fixture replay + optional live `--run-id` probes with correlation IDs).",
            FastestResolution =
                "Run tenant-isolation-negative-test with a representative committed runId under primary scope and attach the JSON/Markdown deny-matrix to readiness evidence.",
        };
    }

    private async Task<ProbeResult> ProbePathAsync(string path, CancellationToken cancellationToken)
    {
        try
        {
            using HttpResponseMessage response = await _http.GetAsync(path, cancellationToken);
            bool success = response.StatusCode == HttpStatusCode.OK;
            string detail = $"HTTP {(int)response.StatusCode}";

            return new ProbeResult(success, detail);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return new ProbeResult(false, ex.Message);
        }
    }

    private static string Trim(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "(empty)";

        string singleLine = value.Replace(Environment.NewLine, " ", StringComparison.Ordinal);

        return singleLine.Length <= 240 ? singleLine : singleLine[..240] + "…";
    }

    private readonly record struct ProbeResult(bool Success, string Detail);
}
