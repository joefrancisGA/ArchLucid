using ArchLucid.Application.Runs;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Replay;

/// <summary>Wave-25 suggestion 247: replay-run execute/commit fail-closed on sealed pin/inventory.</summary>
public static class ReplayRunSourceSealedManifestPinGuard
{
    public static Task EnsureSourceRunReadyOrThrowAsync(
        string originalRunId,
        IReRunExecuteSealedManifestPinGate reRunExecuteSealedManifestPinGate,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(originalRunId);
        ArgumentNullException.ThrowIfNull(reRunExecuteSealedManifestPinGate);

        return reRunExecuteSealedManifestPinGate.EnsureReadyAsync(originalRunId, cancellationToken);
    }
}
