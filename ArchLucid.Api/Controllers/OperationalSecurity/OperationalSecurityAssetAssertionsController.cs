using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.OperationalSecurity;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/operational-security/asset-assertions")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class OperationalSecurityAssetAssertionsController(
    ISecurityAssetAssertionService assertionService,
    IScopeContextProvider scopeProvider,
    IActorContext actorContext) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<SecurityAssetAssertionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        IReadOnlyList<SecurityAssetAssertionRecord> records =
            await assertionService.ListAsync(scope, cancellationToken);

        IReadOnlyList<SecurityAssetAssertionResponse> response = records
            .Select(MapResponse)
            .ToList();

        return Ok(response);
    }

    [HttpPost]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: SecurityAssetAssertionService logs create via IAuditService.")]
    [ProducesResponseType(typeof(SecurityAssetAssertionCreateApiResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] SecurityAssetAssertionCreateApiRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string actorId = actorContext.GetActorId();

        if (!SecurityAssetAssertionApiMapper.TryMapCreateRequest(request, out SecurityAssetAssertionCreateRequest? mapped, out string? mapError))
        {
            return this.BadRequestProblem(mapError ?? "Invalid request.", ProblemTypes.ValidationFailed);
        }

        SecurityAssetAssertionCreateRequest createRequest = mapped!;

        if (string.IsNullOrWhiteSpace(createRequest.RequestedByActorKey))
        {
            createRequest = new SecurityAssetAssertionCreateRequest
            {
                CloudResourceId = createRequest.CloudResourceId,
                DataSensitivity = createRequest.DataSensitivity,
                RegulatoryClass = createRequest.RegulatoryClass,
                DeploymentEnvironment = createRequest.DeploymentEnvironment,
                BusinessCriticality = createRequest.BusinessCriticality,
                IsRevenueImpact = createRequest.IsRevenueImpact,
                IsPatientImpact = createRequest.IsPatientImpact,
                Rationale = createRequest.Rationale,
                EvidenceReference = createRequest.EvidenceReference,
                ExpirationUtc = createRequest.ExpirationUtc,
                RequestedByActorKey = actorId,
                ApprovedByActorKey = createRequest.ApprovedByActorKey,
            };
        }

        SecurityAssetAssertionCreateResult result = await assertionService.CreateAsync(
            scope,
            createRequest,
            cancellationToken);

        if (!result.Succeeded || result.AssertionId is null)
        {
            return this.BadRequestProblem(
                result.ErrorMessage ?? "Asset assertion create failed.",
                ProblemTypes.ValidationFailed);
        }

        return Created(
            $"/v1/operational-security/asset-assertions/{result.AssertionId:D}",
            new SecurityAssetAssertionCreateApiResponse { AssertionId = result.AssertionId.Value });
    }

    [HttpPost("{assertionId:guid}/renew")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: SecurityAssetAssertionService logs renew via IAuditService.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Renew(
        Guid assertionId,
        [FromBody] SecurityAssetAssertionRenewApiRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (assertionId == Guid.Empty)
        {
            return this.BadRequestProblem("AssertionId is required.", ProblemTypes.ValidationFailed);
        }

        if (request is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string actorId = actorContext.GetActorId();

        SecurityAssetAssertionRenewResult result = await assertionService.RenewAsync(
            scope,
            assertionId,
            new SecurityAssetAssertionRenewRequest
            {
                ExpirationUtc = request.ExpirationUtc,
                RenewedByActorKey = string.IsNullOrWhiteSpace(request.RenewedByActorKey)
                    ? actorId
                    : request.RenewedByActorKey,
                ApprovedByActorKey = request.ApprovedByActorKey,
            },
            cancellationToken);

        if (!result.Succeeded)
        {
            if (string.Equals(result.ErrorMessage, "Security asset assertion was not found.", StringComparison.Ordinal))
            {
                return this.NotFoundProblem(
                    result.ErrorMessage ?? "Security asset assertion was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            return this.BadRequestProblem(
                result.ErrorMessage ?? "Asset assertion renew failed.",
                ProblemTypes.ValidationFailed);
        }

        return NoContent();
    }

    [HttpPost("{assertionId:guid}/revoke")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: SecurityAssetAssertionService logs revoke via IAuditService.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Revoke(
        Guid assertionId,
        [FromBody] SecurityAssetAssertionRevokeApiRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (assertionId == Guid.Empty)
        {
            return this.BadRequestProblem("AssertionId is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string actorId = actorContext.GetActorId();

        SecurityAssetAssertionRevokeResult result = await assertionService.RevokeAsync(
            scope,
            assertionId,
            string.IsNullOrWhiteSpace(request?.RevokedByActorKey) ? actorId : request.RevokedByActorKey,
            cancellationToken);

        if (!result.Succeeded)
        {
            if (string.Equals(result.ErrorMessage, "Security asset assertion was not found.", StringComparison.Ordinal))
            {
                return this.NotFoundProblem(
                    result.ErrorMessage ?? "Security asset assertion was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            return this.BadRequestProblem(
                result.ErrorMessage ?? "Asset assertion revoke failed.",
                ProblemTypes.ValidationFailed);
        }

        return NoContent();
    }

    [HttpPost("sweep-expired")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: SecurityAssetAssertionService logs expiry sweep via IAuditService.")]
    [ProducesResponseType(typeof(SecurityAssetAssertionExpirySweepApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> SweepExpired(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        SecurityAssetAssertionExpirySweepResult result =
            await assertionService.SweepExpiredAsync(scope, cancellationToken);

        return Ok(new SecurityAssetAssertionExpirySweepApiResponse
        {
            ExpiredCount = result.ExpiredCount,
            ObservationsCreatedCount = result.ObservationsCreatedCount,
        });
    }

    private static SecurityAssetAssertionResponse MapResponse(SecurityAssetAssertionRecord record) =>
        new()
        {
            AssertionId = record.AssertionId,
            CloudResourceId = record.CloudResourceId,
            DataSensitivity = record.DataSensitivity.ToString(),
            RegulatoryClass = record.RegulatoryClass.ToString(),
            DeploymentEnvironment = record.DeploymentEnvironment.ToString(),
            BusinessCriticality = record.BusinessCriticality.ToString(),
            IsRevenueImpact = record.IsRevenueImpact,
            IsPatientImpact = record.IsPatientImpact,
            Rationale = record.Rationale,
            EvidenceReference = record.EvidenceReference,
            ExpirationUtc = record.ExpirationUtc,
            Status = record.Status.ToString(),
            QualifiesAsCrownJewel = record.QualifiesAsCrownJewel(),
            CreatedUtc = record.CreatedUtc,
            UpdatedUtc = record.UpdatedUtc,
        };
}
