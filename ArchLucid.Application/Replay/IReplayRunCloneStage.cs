using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Replay;

/// <summary>
///     Clones replay-bound tasks and evidence packages from a source run.
/// </summary>
public interface IReplayRunCloneStage
{
    /// <summary>
    ///     Creates a deep copy of <paramref name="original"/> bound to <paramref name="replayRunId"/>.
    /// </summary>
    AgentEvidencePackage CloneEvidenceForReplay(AgentEvidencePackage original, string replayRunId);

    /// <summary>
    ///     Clones agent tasks for a replay run with fresh task ids and Created status.
    /// </summary>
    List<AgentTask> CloneTasksForReplay(IReadOnlyList<AgentTask> tasks, string replayRunId);

    /// <summary>
    ///     Derives a replay manifest version from the current manifest version.
    /// </summary>
    string BuildReplayManifestVersion(string? currentManifestVersion);
}
