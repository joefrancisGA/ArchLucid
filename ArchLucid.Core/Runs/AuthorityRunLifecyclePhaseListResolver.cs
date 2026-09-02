using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Core.Runs;

/// <summary>
///     Wave-6 suggestion 58 / wave-7 suggestion 70: lightweight lifecycle phase for list/summary surfaces.
/// </summary>
public static class AuthorityRunLifecyclePhaseListResolver
{
    public static AuthorityRunLifecyclePhase ResolveFromRunHeader(RunRecord header)
    {
        ArgumentNullException.ThrowIfNull(header);

        if (header.GoldenManifestId is Guid goldenManifestId && goldenManifestId != Guid.Empty)
            return AuthorityRunLifecyclePhase.Complete;

        if (RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(header))
            return AuthorityRunLifecyclePhase.Failed;

        if (header.ContextSnapshotId is Guid contextId && contextId != Guid.Empty)
            return AuthorityRunLifecyclePhase.InProgress;

        return AuthorityRunLifecyclePhase.NotStarted;
    }
}
