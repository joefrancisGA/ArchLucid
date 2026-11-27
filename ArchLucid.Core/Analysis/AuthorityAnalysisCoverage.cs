using ArchLucid.Contracts.Analysis;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Core.Analysis;

/// <summary>Maps sealed engine evidence into bounded coverage without changing commit policy.</summary>
public static class AuthorityAnalysisCoverage
{
    public static bool HasCommitBlockingFailures(FindingsSnapshot snapshot) =>
        FindingEngineFailureCommitClassifier.HasCommitBlockingFailures(snapshot.EngineFailures);

    public static bool IsPartiallyComplete(FindingsSnapshot snapshot) =>
        snapshot.GenerationStatus == FindingsSnapshotGenerationStatus.PartiallyComplete
        || (snapshot.GenerationStatus == FindingsSnapshotGenerationStatus.Complete && snapshot.EngineFailures.Count > 0);

    public static bool IsUnsealedOrFailed(FindingsSnapshot snapshot) =>
        snapshot.GenerationStatus is FindingsSnapshotGenerationStatus.Generating or FindingsSnapshotGenerationStatus.Failed;

    public static AnalysisCoverageSummary Evaluate(FindingsSnapshot? snapshot, string? runStatus = null)
    {
        const string stage = "finding_engines";

        if (snapshot is null)
        {
            string missingState = DefinedEnum.TryParse(runStatus, ignoreCase: true, out ArchitectureRunStatus lifecycle)
                ? lifecycle switch
                {
                    ArchitectureRunStatus.Created or ArchitectureRunStatus.TasksGenerated or
                        ArchitectureRunStatus.WaitingForResults or ArchitectureRunStatus.ReadyForCommit or
                        ArchitectureRunStatus.Retrying => AnalysisCoverageStates.Pending,
                    ArchitectureRunStatus.Failed or ArchitectureRunStatus.FailedPartial => AnalysisCoverageStates.Failed,
                    ArchitectureRunStatus.PartiallyCompleted or ArchitectureRunStatus.ExecutionCompletedQualityRejected =>
                        AnalysisCoverageStates.Incomplete,
                    _ => AnalysisCoverageStates.Unknown,
                }
                : AnalysisCoverageStates.Unknown;

            return new AnalysisCoverageSummary
            {
                Scope = "authority_findings",
                State = missingState,
                ReasonCodes = ["findings_snapshot_missing"],
                MissingSources = [stage],
                Stages = [new(stage, missingState)],
            };
        }

        bool blocking = HasCommitBlockingFailures(snapshot);
        string? comparison = snapshot.RequirementComparisonRecovery;
        string comparisonState = comparison switch
        {
            RequirementComparisonRecoveryCodes.NoFindings or RequirementComparisonRecoveryCodes.WithFindings
                or RequirementComparisonRecoveryCodes.RecoveredNoFindings or RequirementComparisonRecoveryCodes.RecoveredWithFindings
                => AnalysisCoverageStates.Complete,
            RequirementComparisonRecoveryCodes.RetryExhausted or RequirementComparisonRecoveryCodes.RetryStopped
                => AnalysisCoverageStates.Failed,
            _ => AnalysisCoverageStates.Unknown,
        };
        string recovery = comparison switch
        {
            RequirementComparisonRecoveryCodes.RecoveredNoFindings or RequirementComparisonRecoveryCodes.RecoveredWithFindings => "recovered",
            RequirementComparisonRecoveryCodes.RetryExhausted => "retry_exhausted",
            RequirementComparisonRecoveryCodes.RetryStopped => "retry_stopped",
            _ when comparisonState == AnalysisCoverageStates.Complete => "completed",
            _ => AnalysisCoverageStates.Unknown,
        };
        string engineState = snapshot.GenerationStatus switch
        {
            FindingsSnapshotGenerationStatus.Generating => AnalysisCoverageStates.Pending,
            FindingsSnapshotGenerationStatus.Failed => AnalysisCoverageStates.Failed,
            _ when IsPartiallyComplete(snapshot) => AnalysisCoverageStates.Incomplete,
            FindingsSnapshotGenerationStatus.Complete when snapshot.HasRecordedGenerationStatus && !snapshot.CoverageOutputUnavailable => AnalysisCoverageStates.Complete,
            _ => AnalysisCoverageStates.Unknown,
        };
        List<string> reasons = [];
        List<string> missing = [];

        if (engineState != AnalysisCoverageStates.Complete)
        {
            reasons.Add(engineState switch
            {
                AnalysisCoverageStates.Pending => "findings_pending",
                AnalysisCoverageStates.Failed => "findings_failed",
                AnalysisCoverageStates.Incomplete when blocking => "required_engines_failed",
                AnalysisCoverageStates.Incomplete when snapshot.EngineFailures.Count > 0 => "advisory_engines_failed",
                AnalysisCoverageStates.Incomplete => "engine_coverage_incomplete",
                _ when snapshot.CoverageOutputUnavailable => "findings_output_missing",
                _ => "generation_status_unverified",
            });
            missing.Add(stage);
        }

        if (comparisonState == AnalysisCoverageStates.Failed)
        {
            reasons.Add(recovery);
            missing.Add("requirement_comparison");
        }

        string state = engineState == AnalysisCoverageStates.Complete && comparisonState == AnalysisCoverageStates.Failed
            ? AnalysisCoverageStates.Incomplete : engineState;
        return new AnalysisCoverageSummary
        {
            Scope = "authority_findings",
            State = state,
            // The finding record describes the evaluated input snapshot, never the current environment.
            Freshness = snapshot.CreatedUtc == default ? AnalysisCoverageStates.Unknown : "historical",
            EvidenceAsOfUtc = snapshot.CreatedUtc == default ? null : snapshot.CreatedUtc,
            Recovery = recovery,
            AdvisoryOnlyDegradation = IsPartiallyComplete(snapshot) && !blocking && snapshot.EngineFailures.Count > 0
                && comparisonState != AnalysisCoverageStates.Failed,
            ReasonCodes = reasons,
            MissingSources = missing,
            Stages = [new(stage, engineState), new("requirement_comparison", comparisonState)],
        };
    }
}
