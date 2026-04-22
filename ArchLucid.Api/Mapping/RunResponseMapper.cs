using ArchLucid.Api.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.DecisionTraces;
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
        IEnumerable<DecisionTrace> decisionTraces,
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
        IEnumerable<DecisionTrace> decisionTraces,
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
        List<DecisionTrace> decisionTraces)
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
