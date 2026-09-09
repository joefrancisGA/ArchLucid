using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

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
public sealed partial class ArchitecturesController(
    IScopeContextProvider scopeProvider,
    IActorContext actorContext,
    IArchitectureIdentityService architectureIdentityService,
    IArchitectureSealDeltaService architectureSealDeltaService,
    IAuditService auditService,
    IRunRepository runRepository,
    IGoldenManifestRepository goldenManifestRepository,
    IManifestHashService manifestHashService,
    IRunDetailQueryService runDetailQueryService,
    IAuthorityQueryService authorityQueryService) : ControllerBase
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IGoldenManifestRepository _goldenManifestRepository =
        goldenManifestRepository ?? throw new ArgumentNullException(nameof(goldenManifestRepository));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IArchitectureIdentityService _architectureIdentityService =
        architectureIdentityService ?? throw new ArgumentNullException(nameof(architectureIdentityService));

    private readonly IArchitectureSealDeltaService _architectureSealDeltaService =
        architectureSealDeltaService ?? throw new ArgumentNullException(nameof(architectureSealDeltaService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    /// <summary>Lists architecture identities in the current tenant/workspace/project scope.</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet]
    [ProducesResponseType(typeof(ArchitectureIdentityListPage), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
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

        IActionResult? sealedGuardResult =
            await EnsureArchitectureIdentityListSealedManifestReadAllowedAsync(scope, response, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        return Ok(response);
    }

    /// <summary>Gets one architecture identity with child draft and review summaries.</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet("{architectureId:guid}")]
    [ProducesResponseType(typeof(ArchitectureIdentityDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
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

        IActionResult? sealedGuardResult = await EnsureArchitectureIdentitySealedManifestReadAllowedAsync(
            scope,
            architectureId,
            detail.LatestSealedManifestId,
            cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        return Ok(detail);
    }

    /// <summary>
    ///     Read-only projection of how the current draft differs from the latest sealed golden manifest (PC-06).
    /// </summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet("{architectureId:guid}/seal-delta")]
    [ProducesResponseType(typeof(ArchitectureSealDeltaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetSealDelta(Guid architectureId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IActionResult? sealedGuardResult =
            await EnsureArchitectureSealDeltaSealedManifestReadAllowedAsync(scope, architectureId, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        try
        {
            ArchitectureSealDeltaResponse? delta = await _architectureSealDeltaService.GetSealDeltaAsync(
                scope,
                architectureId,
                cancellationToken);

            if (delta is null)
            {
                return this.NotFoundProblem(
                    $"Architecture '{architectureId:D}' was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            return Ok(delta);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }

    /// <summary>Renames or updates metadata for one architecture identity.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpPatch("{architectureId:guid}")]
    [ProducesResponseType(typeof(ArchitectureIdentityDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
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

        IActionResult? sealedGuardResult =
            await EnsureArchitectureIdentityMutationSealedManifestAllowedAsync(scope, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

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
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
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
