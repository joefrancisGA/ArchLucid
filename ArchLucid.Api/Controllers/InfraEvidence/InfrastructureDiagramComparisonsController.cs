using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using System.Security.Claims;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.InfraEvidence;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/infrastructure/diagram-comparisons")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class InfrastructureDiagramComparisonsController(
    IInfrastructureDiagramComparisonService comparisonService,
    IScopeContextProvider scopeProvider) : ControllerBase
{
    private readonly IInfrastructureDiagramComparisonService _comparisonService =
        comparisonService ?? throw new ArgumentNullException(nameof(comparisonService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    [HttpPost]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Advisory diagram comparison persists deterministic correspondence rows per snapshot.")]
    [ProducesResponseType(typeof(DiagramInfrastructureReconciliationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Compare(
        [FromBody] InfrastructureDiagramComparisonCreateRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || request.SnapshotId == Guid.Empty || request.Sources.Count == 0)
        {
            return this.BadRequestProblem(
                "SnapshotId and at least one diagram source are required.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            DiagramInfrastructureReconciliationResult result = await _comparisonService.CompareAsync(
                scope,
                request,
                ResolveActorOid(),
                cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (InvalidOperationException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
    }

    [HttpGet("{comparisonId:guid}")]
    [ProducesResponseType(typeof(DiagramInfrastructureReconciliationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetComparison(Guid comparisonId, CancellationToken cancellationToken = default)
    {
        if (comparisonId == Guid.Empty)
        {
            return this.BadRequestProblem("ComparisonId is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        DiagramInfrastructureReconciliationResult? result = await _comparisonService.TryGetComparisonAsync(
            scope,
            comparisonId,
            cancellationToken);

        if (result is null)
        {
            return this.NotFoundProblem(
                "Diagram comparison was not found.",
                ProblemTypes.ResourceNotFound);
        }

        return Ok(result);
    }

    [HttpPut("{comparisonId:guid}/node-mappings")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Confirmed diagram node mapping persists architect assertion and refreshes comparison.")]
    [ProducesResponseType(typeof(DiagramInfrastructureReconciliationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SaveNodeMapping(
        Guid comparisonId,
        [FromBody] InfrastructureDiagramNodeMappingSaveRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (comparisonId == Guid.Empty)
        {
            return this.BadRequestProblem("ComparisonId is required.", ProblemTypes.ValidationFailed);
        }

        if (request is null || request.CloudResourceId == Guid.Empty)
        {
            return this.BadRequestProblem("CloudResourceId is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            DiagramInfrastructureReconciliationResult result = await _comparisonService.SaveNodeMappingAndRefreshAsync(
                scope,
                comparisonId,
                request,
                ResolveActorOid(),
                cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (InvalidOperationException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
    }

    private string? ResolveActorOid() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
}
