using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Pagination;
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
[Route("v{version:apiVersion}/infra-evidence/cloud-resources")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class CloudResourceEvidenceHubController(
    ICloudResourceEvidenceHubService hubService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    [HttpGet("{cloudResourceId:guid}/hub")]
    [ProducesResponseType(typeof(CloudResourceEvidenceHubResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public async Task<IActionResult> GetHub(
        Guid cloudResourceId,
        [FromQuery] Guid? runId,
        [FromQuery] Guid? snapshotId,
        [FromQuery] Guid? assessmentId,
        [FromQuery] Guid? auditEvidenceSnapshotId,
        [FromQuery] Guid? controlId,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        if (cloudResourceId == Guid.Empty)
        {
            return this.BadRequestProblem("CloudResourceId is required.", ProblemTypes.ValidationFailed);
        }

        if (pageSize > PaginationDefaults.MaxPageSize)
        {
            return this.PayloadTooLargeProblem(
                $"pageSize cannot exceed {PaginationDefaults.MaxPageSize}. Use page and pageSize to paginate finding and remediation streams.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        CloudResourceEvidenceHubQuery query = new()
        {
            RunId = runId,
            SnapshotId = snapshotId,
            AssessmentId = assessmentId,
            AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
            ControlId = controlId,
            Page = page,
            PageSize = pageSize,
        };

        CloudResourceEvidenceHubQueryResult result = await hubService.TryGetHubAsync(
            scope,
            cloudResourceId,
            query,
            cancellationToken);

        if (!result.Succeeded || result.Hub is null)
        {
            return this.NotFoundProblem(
                result.ErrorMessage ?? "Cloud resource evidence hub was not found.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(result.Hub);
    }
}
