using ArchLucid.Contracts.Analysis;
using ArchLucid.Core.Analysis;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

namespace ArchLucid.Application.InfraEvidence;

internal static class SecureNowPathAnalysisCoverage
{
    internal static AnalysisCoverageSummary Evaluate(
        AzureInventorySnapshotRecord capture,
        SecureNowAnalysisRecoveryJob? job,
        AnalysisRecoveryClaim? claim,
        string? receiptRejection,
        bool hasVerifiedReceipt,
        bool hasSearchLimits,
        bool hasUnevaluatedPaths,
        bool hasUnrankedPaths,
        DateTime nowUtc,
        int maximumAgeHours)
    {
        const string inventory = "inventory_capture";
        const string paths = "path_engines";
        const string ranking = "path_ranking";
        string captureState = capture.CaptureStatus switch
        {
            AzureInventoryCaptureStatus.Pending => AnalysisCoverageStates.Pending,
            AzureInventoryCaptureStatus.Failed => AnalysisCoverageStates.Failed,
            AzureInventoryCaptureStatus.Succeeded when !IsCompleteCapture(capture) => AnalysisCoverageStates.Incomplete,
            AzureInventoryCaptureStatus.Succeeded => AnalysisCoverageStates.Complete,
            AzureInventoryCaptureStatus.Partial => AnalysisCoverageStates.Incomplete,
            _ => AnalysisCoverageStates.Unknown,
        };
        string recovery = job?.Outcome switch
        {
            "retry_exhausted" => "retry_exhausted",
            "timed_out" => "timed_out",
            "failed" => "failed",
            "succeeded" when hasVerifiedReceipt && claim is { Attempts: > 1 } => "recovered",
            "succeeded" => "completed",
            _ when job is null => AnalysisCoverageStates.Unknown,
            _ when nowUtc >= job.DeadlineUtc => "deadline_elapsed",
            _ when claim is { State: "retry" } => "retry_pending",
            _ when claim is { State: "running" } => "running",
            _ => "pending",
        };
        List<string> reasons = [];
        List<string> missing = [];
        string freshness = capture.CapturedUtc switch
        {
            null => AnalysisCoverageStates.Unknown,
            { } captured when captured > nowUtc => AnalysisCoverageStates.Unknown,
            { } captured when nowUtc - captured >= TimeSpan.FromHours(Math.Clamp(maximumAgeHours, 1, 720)) =>
                AnalysisCoverageStates.Stale,
            _ => "historical",
        };

        if (captureState != AnalysisCoverageStates.Complete)
        {
            reasons.Add(captureState switch
            {
                AnalysisCoverageStates.Pending => "inventory_pending",
                AnalysisCoverageStates.Failed => "inventory_failed",
                _ => "inventory_coverage_unverified",
            });
            missing.Add(inventory);
        }

        string pathState = job?.Outcome is { } outcome
            ? AnalysisCoverageStates.FromStageOutcome(outcome)
            : job is null ? AnalysisCoverageStates.Unknown
                : recovery == "deadline_elapsed" ? AnalysisCoverageStates.Failed : AnalysisCoverageStates.Pending;

        if (pathState == AnalysisCoverageStates.Complete && !hasVerifiedReceipt)
            pathState = receiptRejection is null ? AnalysisCoverageStates.Unknown : AnalysisCoverageStates.Stale;

        string? failureReason = claim is { State: "failed" } ? AnalysisCoverageReasons.Decode(claim.ResultReference) : null;

        if (pathState != AnalysisCoverageStates.Complete)
        {
            if (failureReason is not null)
                reasons.Add(failureReason);

            reasons.Add(pathState switch
            {
                AnalysisCoverageStates.Failed => recovery,
                AnalysisCoverageStates.Pending => "analysis_pending",
                AnalysisCoverageStates.Stale => receiptRejection!,
                _ => "analysis_completion_unverified",
            });
            missing.Add(paths);
        }

        if (hasSearchLimits || hasUnevaluatedPaths)
        {
            if (pathState is AnalysisCoverageStates.Complete or AnalysisCoverageStates.Unknown)
                pathState = AnalysisCoverageStates.Incomplete;

            if (!missing.Contains(paths))
                missing.Add(paths);
        }

        if (hasSearchLimits)
            reasons.Add("search_coverage_limited");

        if (hasUnevaluatedPaths)
            reasons.Add("path_evidence_incomplete");

        if (hasUnrankedPaths)
        {
            reasons.Add("path_ranking_missing");
            missing.Add(ranking);
        }

        if (freshness == AnalysisCoverageStates.Stale)
            reasons.Add("inventory_stale");

        string state = captureState != AnalysisCoverageStates.Complete ? captureState
            : pathState != AnalysisCoverageStates.Complete ? pathState
            : hasUnrankedPaths ? AnalysisCoverageStates.Incomplete
            : AnalysisCoverageStates.Complete;
        return new AnalysisCoverageSummary
        {
            Scope = "securenow_attack_paths",
            State = state,
            Freshness = freshness,
            EvidenceAsOfUtc = capture.CapturedUtc,
            Recovery = recovery,
            ReasonCodes = reasons,
            MissingSources = missing,
            Stages = [new(inventory, captureState), new(paths, pathState),
                new(ranking, hasUnrankedPaths ? AnalysisCoverageStates.Incomplete : pathState)],
        };
    }

    private static bool IsCompleteCapture(AzureInventorySnapshotRecord capture) =>
        capture is { ErrorCount: 0, WarningCount: 0, CompletenessScore: 1m, ContentHashSha256.Length: 32, CapturedUtc: not null };
}
