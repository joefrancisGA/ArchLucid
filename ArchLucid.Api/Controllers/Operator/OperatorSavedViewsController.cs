using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Operator;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Operator;

/// <summary>Per-user saved filter/view presets for operator Audit log and Graph explorer surfaces.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AuthenticatedUserOnly)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/operator/saved-views")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class OperatorSavedViewsController(
    IScopeContextProvider scopeProvider,
    IActorContext actorContext,
    IOperatorSavedViewRepository savedViewRepository) : ControllerBase
{
    private const int MaxNameLength = 200;

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IOperatorSavedViewRepository _savedViewRepository =
        savedViewRepository ?? throw new ArgumentNullException(nameof(savedViewRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    /// <summary>Lists saved views for the current tenant and user, optionally filtered by surface.</summary>
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [HttpGet]
    [ProducesResponseType(typeof(OperatorSavedViewListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ListSavedViews([FromQuery] string? surface, CancellationToken cancellationToken)
    {
        string? normalizedSurface = OperatorSavedViewSurfaces.NormalizeOrNull(surface);

        if (surface is not null && normalizedSurface is null)
        {
            return this.BadRequestProblem(
                "surface must be 'audit' or 'graph' when provided.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string userId = _actorContext.GetActorId();
        IReadOnlyList<OperatorSavedViewResponse> views = await _savedViewRepository.ListAsync(
            scope.TenantId,
            userId,
            normalizedSurface,
            cancellationToken);

        return Ok(new OperatorSavedViewListResponse { Views = views });
    }

    /// <summary>Creates a saved view for the current tenant and user.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpPost]
    [ProducesResponseType(typeof(OperatorSavedViewResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateSavedView(
        [FromBody] CreateOperatorSavedViewRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        string? surface = OperatorSavedViewSurfaces.NormalizeOrNull(body.Surface);

        if (surface is null)
        {
            return this.BadRequestProblem("surface must be 'audit' or 'graph'.", ProblemTypes.ValidationFailed);
        }

        string name = body.Name.Trim();

        if (name.Length == 0 || name.Length > MaxNameLength)
        {
            return this.BadRequestProblem(
                $"name must be between 1 and {MaxNameLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        if (body.Payload.Filters.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
        {
            return this.BadRequestProblem("payload.filters is required.", ProblemTypes.ValidationFailed);
        }

        string payloadJson = JsonSerializer.Serialize(body.Payload, ContractJson.CamelCaseIgnoreNullCompact);
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string userId = _actorContext.GetActorId();

        try
        {
            OperatorSavedViewResponse? created = await _savedViewRepository.CreateAsync(
                scope.TenantId,
                userId,
                surface,
                name,
                payloadJson,
                body.Payload.Sort,
                cancellationToken);

            if (created is null)
            {
                return this.NotFoundProblem(
                    "Tenant was not found for the current scope.",
                    ProblemTypes.ResourceNotFound);
            }

            return CreatedAtAction(nameof(ListSavedViews), new { surface }, created);
        }
        catch (InvalidOperationException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }

    /// <summary>Deletes a saved view owned by the current tenant and user.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpDelete("{viewId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSavedView(Guid viewId, CancellationToken cancellationToken)
    {
        if (viewId == Guid.Empty)
        {
            return this.NotFoundProblem("Saved view was not found.", ProblemTypes.ResourceNotFound);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string userId = _actorContext.GetActorId();
        bool deleted = await _savedViewRepository.DeleteAsync(scope.TenantId, userId, viewId, cancellationToken);

        if (!deleted)
        {
            return this.NotFoundProblem("Saved view was not found.", ProblemTypes.ResourceNotFound);
        }

        return NoContent();
    }
}
