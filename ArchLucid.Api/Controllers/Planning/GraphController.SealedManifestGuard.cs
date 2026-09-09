using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Manifest;
using ArchLucid.Provenance;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Planning;

public sealed partial class GraphController
{
    private IActionResult? EnsureGoldenManifestSealedReadAllowed(ManifestDocument? goldenManifest, Guid runId)
    {
        if (goldenManifest is null)
            return null;

        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                goldenManifest,
                runId.ToString("D"),
                manifestHashService);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }
}
