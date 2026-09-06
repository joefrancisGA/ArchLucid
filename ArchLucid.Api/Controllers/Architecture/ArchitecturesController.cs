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

namespace ArchLucid.Api.Controllers.Architecture;

/// <summary>Customer-visible architecture identities (ADR 0074).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AuthenticatedUserOnly)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architectures")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class ArchitecturesController(
    IScopeContextProvider scopeProvider,
    IActorContext actorContext,
    IAuditService auditService,
    IArchitectureIdentityCustomerService architectureIdentityCustomerService) : ControllerBase
{
    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IArchitectureIdentityCustomerService _architectureIdentityCustomerService =
        architectureIdentityCustomerService
        ?? throw new ArgumentNullException(nameof(architectureIdentityCustomerService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    /// <summary>Lists named architecture identities in the current workspace scope.</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<ArchitectureIdentityListItem>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListArchitectures(
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        ArchitectureIdentityListResult result = await _architectureIdentityCustomerService.ListAsync(
            scope,
            page,
            pageSize,
            cancellationToken);

        PagedResponse<ArchitectureIdentityListItem> response = PagedResponseBuilder.FromDatabasePage(
            result.Items,
            result.TotalCount,
            page,
            pageSize);

        return Ok(response);
    }

    /// <summary>Gets one architecture identity with child summaries for the Monday desk.</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet("{architectureId:guid}")]
    [ProducesResponseType(typeof(ArchitectureIdentityWithChildren), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetArchitecture(
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        ArchitectureIdentityWithChildren? identity = await _architectureIdentityCustomerService.GetAsync(
            scope,
            architectureId,
            cancellationToken);

        if (identity is null)
            return NotFound();

        return Ok(identity);
    }

    /// <summary>Renames the customer-visible architecture identity.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpPatch("{architectureId:guid}")]
    [ProducesResponseType(typeof(ArchitectureIdentityRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PatchArchitecture(
        Guid architectureId,
        [FromBody] ArchitectureIdentityPatchRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            ArchitectureIdentityRecord? updated = await _architectureIdentityCustomerService.RenameAsync(
                scope,
                architectureId,
                body,
                cancellationToken);

            if (updated is null)
                return NotFound();

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ArchitectureIdentityPatched,
                    ActorUserId = _actorContext.GetActorId(),
                    ActorUserName = _actorContext.GetActor(),
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(new
                    {
                        architectureId,
                        displayName = updated.DisplayName,
                    }),
                },
                cancellationToken);

            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
