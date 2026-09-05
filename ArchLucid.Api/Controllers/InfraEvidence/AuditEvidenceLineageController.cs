using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
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
public sealed class AuditEvidenceLineageController(
    IAuditEvidenceLineageService lineageService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    [HttpGet("{assessmentId:guid}/snapshots/{snapshotId:guid}/controls/{controlId:guid}/lineage")]
    [ProducesResponseType(typeof(AuditEvidenceLineageRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetControlLineage(
        Guid assessmentId,
        Guid snapshotId,
        Guid controlId,
        CancellationToken cancellationToken = default)
    {
        if (assessmentId == Guid.Empty || snapshotId == Guid.Empty || controlId == Guid.Empty)
        {
            return this.BadRequestProblem(
                "AssessmentId, snapshotId, and controlId are required.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        AuditEvidenceLineageQueryResult result = await lineageService.TryGetControlLineageAsync(
            scope,
            assessmentId,
            snapshotId,
            controlId,
            cancellationToken);

        if (!result.Succeeded || result.Lineage is null)
        {
            return this.NotFoundProblem(
                result.ErrorMessage ?? "Audit evidence lineage was not found.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(result.Lineage);
    }
}
