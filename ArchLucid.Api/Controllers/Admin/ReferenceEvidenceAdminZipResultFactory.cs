using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Pilots;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Security;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Shared ZIP response builder for scope-only and legacy reference-evidence admin routes (TB-279).</summary>
internal static class ReferenceEvidenceAdminZipResultFactory
{
    internal static async Task<IActionResult> BuildZipAsync(
        ControllerBase controller,
        IReferenceEvidenceAdminExportService exportService,
        ScopeContext scope,
        string baseForLinks,
        bool includeDemo,
        Guid filenameTenantId,
        CancellationToken cancellationToken)
    {
        byte[]? zip = await exportService.BuildZipAsync(scope.TenantId, includeDemo, baseForLinks, cancellationToken);

        if (zip is null || zip.Length == 0)
        {
            return controller.NotFoundProblem(
                "No reference evidence ZIP could be built for this tenant (no qualifying committed run, or export produced no content).",
                ProblemTypes.ResourceNotFound);
        }

        return controller.File(zip, "application/zip", $"reference-evidence-{filenameTenantId:D}.zip");
    }
}
