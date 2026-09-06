using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Architecture;

/// <summary>Customer-visible architecture identities (ADR 0074).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AuthenticatedUserOnly)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architectures")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class ArchitecturesController(
    IScopeContextProvider scopeProvider,
    IActorContext actorContext,
    IArchitectureIdentityService architectureIdentityService,
    IAuditService auditService) : ControllerBase
{
    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IArchitectureIdentityService _architectureIdentityService =
        architectureIdentityService ?? throw new ArgumentNullException(nameof(architectureIdentityService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    /// <summary>Lists architecture identities in the current tenant/workspace/project scope.</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet]
    [ProducesResponseType(typeof(ArchitectureIdentityListPage), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListArchitectures(
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        [FromQuery] bool includeArchived = false,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        ArchitectureIdentityListPage response = await _architectureIdentityService.ListIdentitiesAsync(
            scope,
            page,
            pageSize,
            includeArchived,
            cancellationToken);

        return Ok(response);
    }

    /// <summary>Gets one architecture identity with child draft and review summaries.</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet("{architectureId:guid}")]
    [ProducesResponseType(typeof(ArchitectureIdentityDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetArchitecture(Guid architectureId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        ArchitectureIdentityDetail? detail = await _architectureIdentityService.GetIdentityAsync(
            scope,
            architectureId,
            cancellationToken);

        if (detail is null)
        {
            return this.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(detail);
    }

    /// <summary>Renames or updates metadata for one architecture identity.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpPatch("{architectureId:guid}")]
    [ProducesResponseType(typeof(ArchitectureIdentityDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PatchArchitecture(
        Guid architectureId,
        [FromBody] PatchArchitectureIdentityRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (!body.HasAnyPatch)
            return this.BadRequestProblem("At least one patch field is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            ArchitectureIdentityRecord? updated = await _architectureIdentityService.PatchAsync(
                scope,
                architectureId,
                body,
                cancellationToken);

            if (updated is null)
            {
                return this.NotFoundProblem(
                    $"Architecture '{architectureId:D}' was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            ArchitectureIdentityDetail? detail = await _architectureIdentityService.GetIdentityAsync(
                scope,
                architectureId,
                cancellationToken);

            if (detail is null)
            {
                return this.NotFoundProblem(
                    $"Architecture '{architectureId:D}' was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            string auditEventType = body.HasArchived
                ? body.Archived!.Value
                    ? AuditEventTypes.ArchitectureIdentityArchived
                    : AuditEventTypes.ArchitectureIdentityRestored
                : AuditEventTypes.ArchitectureIdentityPatched;

            await _auditService.LogAsync(
                BuildArchitectureAuditEvent(
                    scope,
                    auditEventType,
                    new
                    {
                        architectureId,
                        displayName = detail.DisplayName,
                        hasDescriptionPatch = body.HasDescription,
                        archived = detail.ArchivedUtc.HasValue,
                    }),
                cancellationToken);

            return Ok(detail);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }

    private AuditEvent BuildArchitectureAuditEvent(ScopeContext scope, string eventType, object payload)
    {
        string actor = _actorContext.GetActor();

        return new AuditEvent
        {
            EventType = eventType,
            ActorUserId = _actorContext.GetActorId(),
            ActorUserName = actor,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            DataJson = JsonSerializer.Serialize(payload),
        };
    }
}
