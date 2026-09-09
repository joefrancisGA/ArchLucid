using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Api.Support;

public sealed partial class AuthorityRunReadHandlers
{
    private void EnsureGoldenManifestSealedReadAllowed(RunDetailDto detail, Guid runId)
    {
        if (detail.GoldenManifest is null)
            return;

        SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
            detail.GoldenManifest,
            runId.ToString("D"),
            _manifestHashService);
    }
}
