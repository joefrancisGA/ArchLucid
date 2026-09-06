using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.InfraEvidence;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/infra-evidence/audit-assessments")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class AuditEvidencePackageController(
    IAuditEvidencePackageExportService exportService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    [HttpGet("{assessmentId:guid}/snapshots/{snapshotId:guid}/evidence-package.zip")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DownloadEvidencePackage(
        Guid assessmentId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        if (assessmentId == Guid.Empty || snapshotId == Guid.Empty)
            return this.BadRequestProblem("AssessmentId and snapshotId are required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            AuditEvidencePackageExportResult result = await exportService.TryExportAsync(
                scope,
                assessmentId,
                snapshotId,
                cancellationToken);

            if (!result.Succeeded || result.ZipContent is null)
            {
                return this.NotFoundProblem(
                    result.ErrorMessage ?? "Audit evidence package could not be exported.",
                    ProblemTypes.ResourceNotFound);
            }

            return File(result.ZipContent, "application/zip", result.PackageFileName);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }
}
