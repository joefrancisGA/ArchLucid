using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Api.Mapping;

internal static class RunResponseMapper
{
    public static CreateArchitectureRunResponse ToCreateRunResponse(
        ArchitectureRun run,
        EvidenceBundle evidenceBundle,
        IEnumerable<AgentTask> tasks)
    {
        return new CreateArchitectureRunResponse { Run = run, EvidenceBundle = evidenceBundle, Tasks = tasks.ToList() };
    }

    /// <summary>Projects one batch item outcome onto the wire contract, mapping failure kinds to problem type codes.</summary>
    public static BatchCreateRunItemResult ToBatchCreateRunItemResult(BatchCreateRunItemOutcome outcome)
    {
        ArgumentNullException.ThrowIfNull(outcome);

        return new BatchCreateRunItemResult
        {
            RequestId = outcome.RequestId,
            RunId = outcome.RunId,
            Succeeded = outcome.Succeeded,
            ErrorCode = ToBatchCreateRunItemErrorCode(outcome.FailureKind),
            ErrorMessage = outcome.ErrorMessage
        };
    }

    private static string? ToBatchCreateRunItemErrorCode(BatchCreateRunItemFailureKind failureKind)
    {
        return failureKind switch
        {
            BatchCreateRunItemFailureKind.None => null,
            BatchCreateRunItemFailureKind.NullItem => null,
            BatchCreateRunItemFailureKind.Conflict => ProblemTypes.Conflict,
            BatchCreateRunItemFailureKind.InvalidRequest => ProblemTypes.BadRequest,
            _ => throw new ArgumentOutOfRangeException(nameof(failureKind), failureKind, "Unhandled batch item failure kind.")
        };
    }

    public static ExecuteRunResponse ToExecuteRunResponse(
        string runId,
        IEnumerable<AgentResult> results)
    {
        return new ExecuteRunResponse { RunId = runId, Results = results.ToList() };
    }

    public static ReplayRunResponse ToReplayRunResponse(
        string originalRunId,
        string replayRunId,
        string executionMode,
        IEnumerable<AgentResult> results,
        GoldenManifest? manifest,
        IEnumerable<DecisionTraceDto> decisionTraces,
        IEnumerable<string> warnings)
    {
        return new ReplayRunResponse
        {
            OriginalRunId = originalRunId,
            ReplayRunId = replayRunId,
            ExecutionMode = executionMode,
            Results = results.ToList(),
            Manifest = manifest,
            DecisionTraces = decisionTraces.ToList(),
            Warnings = warnings.ToList()
        };
    }

    public static CommitRunResponse ToCommitRunResponse(
        GoldenManifest manifest,
        IEnumerable<DecisionTraceDto> decisionTraces,
        IEnumerable<string> warnings)
    {
        return new CommitRunResponse
        {
            Manifest = manifest, DecisionTraces = decisionTraces.ToList(), Warnings = warnings.ToList()
        };
    }

    public static RunDetailsResponse ToRunDetailsResponse(
        ArchitectureRun run,
        List<AgentTask> tasks,
        List<AgentResult> results,
        GoldenManifest? manifest,
        List<DecisionTraceDto> decisionTraces)
    {
        return new RunDetailsResponse
        {
            Run = run,
            Tasks = tasks,
            Results = results,
            Manifest = manifest,
            DecisionTraces = decisionTraces
        };
    }
}
