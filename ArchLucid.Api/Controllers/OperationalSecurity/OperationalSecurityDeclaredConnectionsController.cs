using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
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
[Route("v{version:apiVersion}/operational-security/declared-connections")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class OperationalSecurityDeclaredConnectionsController(
    ISecurityDeclaredConnectionService connectionService,
    IScopeContextProvider scopeProvider,
    IActorContext actorContext) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<SecurityDeclaredConnectionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        IReadOnlyList<SecurityDeclaredConnectionRecord> records =
            await connectionService.ListAsync(scope, cancellationToken);

        IReadOnlyList<SecurityDeclaredConnectionResponse> response = records
            .Select(MapResponse)
            .ToList();

        return Ok(response);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: SecurityDeclaredConnectionService logs create via IAuditService.")]
    [ProducesResponseType(typeof(SecurityDeclaredConnectionCreateApiResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] SecurityDeclaredConnectionCreateApiRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string actorId = actorContext.GetActorId();

        if (!SecurityDeclaredConnectionApiMapper.TryMapCreateRequest(request, out SecurityDeclaredConnectionCreateRequest? mapped, out string? mapError))
        {
            return this.BadRequestProblem(mapError ?? "Invalid request.", ProblemTypes.ValidationFailed);
        }

        SecurityDeclaredConnectionCreateRequest createRequest = mapped!;

        if (string.IsNullOrWhiteSpace(createRequest.RequestedByActorKey))
        {
            createRequest = new SecurityDeclaredConnectionCreateRequest
            {
                FromCloudResourceId = createRequest.FromCloudResourceId,
                ToCloudResourceId = createRequest.ToCloudResourceId,
                RelationshipType = createRequest.RelationshipType,
                Rationale = createRequest.Rationale,
                EvidenceReference = createRequest.EvidenceReference,
                ExpirationUtc = createRequest.ExpirationUtc,
                RequestedByActorKey = actorId,
                ApprovedByActorKey = createRequest.ApprovedByActorKey,
            };
        }

        SecurityDeclaredConnectionCreateResult result = await connectionService.CreateAsync(
            scope,
            createRequest,
            cancellationToken);

        if (!result.Succeeded || result.ConnectionId is null)
        {
            return this.BadRequestProblem(
                result.ErrorMessage ?? "Declared connection create failed.",
                ProblemTypes.ValidationFailed);
        }

        return Created(
            $"/v1/operational-security/declared-connections/{result.ConnectionId:D}",
            new SecurityDeclaredConnectionCreateApiResponse { ConnectionId = result.ConnectionId.Value });
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{connectionId:guid}/renew")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: SecurityDeclaredConnectionService logs renew via IAuditService.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Renew(
        Guid connectionId,
        [FromBody] SecurityDeclaredConnectionRenewApiRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (connectionId == Guid.Empty)
        {
            return this.BadRequestProblem("ConnectionId is required.", ProblemTypes.ValidationFailed);
        }

        if (request is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string actorId = actorContext.GetActorId();

        SecurityDeclaredConnectionRenewResult result = await connectionService.RenewAsync(
            scope,
            connectionId,
            new SecurityDeclaredConnectionRenewRequest
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
            if (string.Equals(result.ErrorMessage, "Declared connection was not found.", StringComparison.Ordinal))
            {
                return this.NotFoundProblem(
                    result.ErrorMessage ?? "Declared connection was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            return this.BadRequestProblem(
                result.ErrorMessage ?? "Declared connection renew failed.",
                ProblemTypes.ValidationFailed);
        }

        return NoContent();
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{connectionId:guid}/revoke")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: SecurityDeclaredConnectionService logs revoke via IAuditService.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Revoke(
        Guid connectionId,
        [FromBody] SecurityDeclaredConnectionRevokeApiRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (connectionId == Guid.Empty)
        {
            return this.BadRequestProblem("ConnectionId is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string actorId = actorContext.GetActorId();

        SecurityDeclaredConnectionRevokeResult result = await connectionService.RevokeAsync(
            scope,
            connectionId,
            string.IsNullOrWhiteSpace(request?.RevokedByActorKey) ? actorId : request.RevokedByActorKey,
            cancellationToken);

        if (!result.Succeeded)
        {
            if (string.Equals(result.ErrorMessage, "Declared connection was not found.", StringComparison.Ordinal))
            {
                return this.NotFoundProblem(
                    result.ErrorMessage ?? "Declared connection was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            return this.BadRequestProblem(
                result.ErrorMessage ?? "Declared connection revoke failed.",
                ProblemTypes.ValidationFailed);
        }

        return NoContent();
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("sweep-expired")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: SecurityDeclaredConnectionService logs expiry sweep via IAuditService.")]
    [ProducesResponseType(typeof(SecurityDeclaredConnectionExpirySweepApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> SweepExpired(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        SecurityDeclaredConnectionExpirySweepResult result =
            await connectionService.SweepExpiredAsync(scope, cancellationToken);

        return Ok(new SecurityDeclaredConnectionExpirySweepApiResponse
        {
            ExpiredCount = result.ExpiredCount,
        });
    }

    private static SecurityDeclaredConnectionResponse MapResponse(SecurityDeclaredConnectionRecord record) =>
        new()
        {
            ConnectionId = record.ConnectionId,
            FromCloudResourceId = record.FromCloudResourceId,
            ToCloudResourceId = record.ToCloudResourceId,
            RelationshipType = record.RelationshipType.ToString(),
            Rationale = record.Rationale,
            EvidenceReference = record.EvidenceReference,
            ExpirationUtc = record.ExpirationUtc,
            Status = record.Status.ToString(),
            CreatedUtc = record.CreatedUtc,
            UpdatedUtc = record.UpdatedUtc,
        };
}
