using System.Security.Claims;

using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Platform admin orchestration for tenant catalog migration fan-out (TB-2046 / TB-2047).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/tenants")]
public sealed class AdminTenantCatalogMigrationController(
    ITenantCatalogMigrationOrchestrator orchestrator,
    ITenantRepository tenantRepository,
    ITenantMigrationStatusService tenantMigrationStatusService) : ControllerBase
{
    private readonly ITenantCatalogMigrationOrchestrator _orchestrator =
        orchestrator ?? throw new ArgumentNullException(nameof(orchestrator));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITenantMigrationStatusService _tenantMigrationStatusService =
        tenantMigrationStatusService ?? throw new ArgumentNullException(nameof(tenantMigrationStatusService));

    [HttpGet("{tenantId:guid}/catalog-migration/status")]
    [ProducesResponseType(typeof(TenantCatalogMigrationStatusResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatusAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        TenantMigrationStatusSnapshot snapshot =
            await _tenantMigrationStatusService.GetForTenantAsync(tenantId, cancellationToken).ConfigureAwait(false);

        return Ok(
            new TenantCatalogMigrationStatusResponse
            {
                InMigration = snapshot.InMigration,
                Message = snapshot.Message,
                CorrelationId = snapshot.CorrelationId,
                Stage = snapshot.Stage,
                MigrationId = snapshot.MigrationId,
                LastVerificationError = snapshot.LastVerificationError,
            });
    }

    [HttpPost("{tenantId:guid}/catalog-migration/start")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> StartAsync(
        Guid tenantId,
        [FromBody] StartTenantCatalogMigrationRequest request,
        CancellationToken cancellationToken)
    {
        (TenantCatalogMigrationCommandOutcome outcome, Guid? migrationId) = await _orchestrator
            .StartAsync(
                tenantId,
                request.CorrelationId,
                ResolveActorUserId(),
                ResolveActorUserName(),
                cancellationToken)
            .ConfigureAwait(false);

        return MapOutcome(outcome, migrationId);
    }

    [HttpPost("{tenantId:guid}/catalog-migration/acknowledge-catalog-attach")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> AcknowledgeCatalogAttachDetachAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        TenantCatalogMigrationCommandOutcome outcome = await _orchestrator
            .AcknowledgeCatalogAttachDetachAsync(tenantId, ResolveActorUserId(), ResolveActorUserName(), cancellationToken)
            .ConfigureAwait(false);

        return MapOutcome(outcome, null);
    }

    [HttpPost("{tenantId:guid}/catalog-migration/projection-refresh")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> RunProjectionRefreshAsync(
        Guid tenantId,
        [FromBody] TenantCatalogMigrationScopeRequest request,
        CancellationToken cancellationToken)
    {
        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationProjectionRefreshResult? refresh) = await _orchestrator
            .RunProjectionRefreshAsync(
                tenantId,
                request.WorkspaceId,
                request.ProjectId,
                ResolveActorUserId(),
                ResolveActorUserName(),
                cancellationToken)
            .ConfigureAwait(false);

        if (outcome != TenantCatalogMigrationCommandOutcome.Applied || refresh is null)
            return MapOutcome(outcome, null);

        return Ok(refresh);
    }

    [HttpPost("{tenantId:guid}/catalog-migration/verify")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> RunVerificationAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        (TenantCatalogMigrationCommandOutcome outcome, TenantMigrationVerificationProbeResult? probe) = await _orchestrator
            .RunVerificationAsync(tenantId, ResolveActorUserId(), ResolveActorUserName(), cancellationToken)
            .ConfigureAwait(false);

        if (probe is null)
            return MapOutcome(outcome, null);

        if (outcome == TenantCatalogMigrationCommandOutcome.VerificationFailed)
        {
            return this.ConflictProblem(
                probe.ErrorMessage ?? "Verification probe failed.",
                ProblemTypes.Conflict);
        }

        return Ok(probe);
    }

    [HttpPost("{tenantId:guid}/catalog-migration/complete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> CompleteAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        TenantCatalogMigrationCommandOutcome outcome = await _orchestrator
            .CompleteAsync(tenantId, ResolveActorUserId(), ResolveActorUserName(), cancellationToken)
            .ConfigureAwait(false);

        if (outcome == TenantCatalogMigrationCommandOutcome.Applied)
            return NoContent();

        return MapOutcome(outcome, null);
    }

    [HttpGet("{tenantId:guid}/catalog-migration/default-scope")]
    [ProducesResponseType(typeof(TenantCatalogMigrationScopeRequest), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDefaultScopeAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        TenantWorkspaceLink? workspace = await _tenantRepository
            .GetFirstWorkspaceAsync(tenantId, cancellationToken)
            .ConfigureAwait(false);

        if (workspace is null)
            return this.NotFoundProblem("Tenant workspace not found.", ProblemTypes.ResourceNotFound);

        return Ok(
            new TenantCatalogMigrationScopeRequest
            {
                WorkspaceId = workspace.WorkspaceId,
                ProjectId = workspace.DefaultProjectId,
            });
    }

    private IActionResult MapOutcome(TenantCatalogMigrationCommandOutcome outcome, Guid? migrationId)
    {
        return outcome switch
        {
            TenantCatalogMigrationCommandOutcome.Applied => Accepted(new { migrationId }),
            TenantCatalogMigrationCommandOutcome.NotFound => this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound),
            TenantCatalogMigrationCommandOutcome.AlreadyActive => this.ConflictProblem(
                migrationId is null
                    ? "Migration already active."
                    : $"Migration already active (migrationId={migrationId:D}).",
                ProblemTypes.Conflict),
            TenantCatalogMigrationCommandOutcome.NoActiveMigration => this.NotFoundProblem("No active catalog migration.", ProblemTypes.ResourceNotFound),
            TenantCatalogMigrationCommandOutcome.VerificationRequired => this.ConflictProblem(
                "Verification probe must pass before completion.",
                ProblemTypes.Conflict),
            TenantCatalogMigrationCommandOutcome.VerificationFailed => this.ConflictProblem(
                "Verification probe failed.",
                ProblemTypes.Conflict),
            TenantCatalogMigrationCommandOutcome.WrongStage => Conflict(new { message = "Catalog migration is not in the expected fan-out stage for this operation." }),
            TenantCatalogMigrationCommandOutcome.AlreadyInDesiredState => NoContent(),
            _ => throw new InvalidOperationException($"Unhandled migration outcome: {outcome}"),
        };
    }

    private string ResolveActorUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "admin";

    private string ResolveActorUserName() =>
        User.FindFirstValue(ClaimTypes.Name) ?? User.Identity?.Name ?? ResolveActorUserId();
}
