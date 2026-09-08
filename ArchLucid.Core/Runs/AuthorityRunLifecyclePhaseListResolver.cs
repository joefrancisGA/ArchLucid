using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Core.Runs;

/// <summary>
///     Wave-6 suggestion 58 / wave-7 suggestion 70 / wave-9 suggestion 81: lightweight lifecycle phase for list/summary surfaces.
/// </summary>
public static class AuthorityRunLifecyclePhaseListResolver
{
    public static AuthorityRunLifecyclePhase ResolveFromRunHeader(RunRecord header)
    {
        ArgumentNullException.ThrowIfNull(header);

        if (RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(header))
            return AuthorityRunLifecyclePhase.Failed;

        if (IsCommittedWithGoldenManifest(header))
            return AuthorityRunLifecyclePhase.Complete;

        if (TryResolveTerminalFailurePhase(header.LegacyRunStatus, out AuthorityRunLifecyclePhase terminalPhase))
            return terminalPhase;

        if (header.ContextSnapshotId is Guid contextId && contextId != Guid.Empty)
            return AuthorityRunLifecyclePhase.InProgress;

        if (header.GoldenManifestId is Guid goldenManifestId && goldenManifestId != Guid.Empty)
            return AuthorityRunLifecyclePhase.InProgress;

        return AuthorityRunLifecyclePhase.NotStarted;
    }

    private static bool IsCommittedWithGoldenManifest(RunRecord header) =>
        header.GoldenManifestId is Guid goldenManifestId
        && goldenManifestId != Guid.Empty
        && string.Equals(
            header.LegacyRunStatus,
            nameof(ArchitectureRunStatus.Committed),
            StringComparison.OrdinalIgnoreCase);

    private static bool TryResolveTerminalFailurePhase(
        string? legacyRunStatus,
        out AuthorityRunLifecyclePhase phase)
    {
        phase = default;

        if (!ArchitectureRunStatusTransitionTable.TryParseStatus(legacyRunStatus, out ArchitectureRunStatus status))
            return false;

        if (status is not ArchitectureRunStatus.Failed
            and not ArchitectureRunStatus.FailedPartial
            and not ArchitectureRunStatus.ExecutionCompletedQualityRejected)
        {
            return false;
        }

        phase = AuthorityRunLifecyclePhase.Failed;

        return true;
    }
}
