using ArchLucid.Api.Models;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Demo;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Demo;

public sealed partial class DemoViewerController
{
    /// <summary>Lists recent runs in the Contoso demo scope.</summary>
    [HttpGet("runs")]
    [ProducesResponseType(typeof(List<RunListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ListRuns(CancellationToken cancellationToken)
    {
        if (!IsViewerAllowed())
            return Unauthorized();

        using IDisposable _ = AmbientScopeContext.Push(DemoScopes.BuildDemoScope());
        IReadOnlyList<RunSummary> summaries = await runDetailQueryService.ListRunSummariesAsync(cancellationToken);

        List<RunListItemResponse> response = summaries
            .Select(r => new RunListItemResponse
            {
                RunId = r.RunId,
                RequestId = r.RequestId,
                Status = r.Status,
                CreatedUtc = r.CreatedUtc,
                CompletedUtc = r.CompletedUtc,
                CurrentManifestVersion = r.CurrentManifestVersion,
                SystemName = r.SystemName,
                GoldenManifestId = r.GoldenManifestId,
                HasGoldenManifest = r.GoldenManifestId.HasValue
            })
            .ToList();

        return Ok(response);
    }
}
