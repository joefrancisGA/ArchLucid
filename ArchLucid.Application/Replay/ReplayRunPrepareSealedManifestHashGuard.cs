using ArchLucid.Application.Runs;

namespace ArchLucid.Application.Replay;

/// <summary>Wave-26 suggestion 258: replay prepare fail-closed before clone side effects.</summary>
public static class ReplayRunPrepareSealedManifestHashGuard
{
    public static Task EnsureSourceRunReadyOrThrowAsync(
        string originalRunId,
        IReRunExecuteSealedManifestPinGate reRunExecuteSealedManifestPinGate,
        CancellationToken cancellationToken) =>
        ReplayRunSourceSealedManifestPinGuard.EnsureSourceRunReadyOrThrowAsync(
            originalRunId,
            reRunExecuteSealedManifestPinGate,
            cancellationToken);
}
