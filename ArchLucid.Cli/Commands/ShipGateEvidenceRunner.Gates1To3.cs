using System.Net;
using System.Text.Json;

using ArchLucid.Cli;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Commands;

internal sealed partial class ShipGateEvidenceRunner
{
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
}
