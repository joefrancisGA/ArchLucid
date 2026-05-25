using System.Text.Json;

using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Roi;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>
///     Per-tenant ROI cost assumptions used when computing <c>EstimatedUsdSavings</c> on pilot deltas and executive ROI
///     summaries.
/// </summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/cost-settings")]
public sealed class TenantCostSettingsController(
    ITenantCostSettingsRepository repository,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    IOptions<ValueReportComputationOptions> computationOptions) : ControllerBase
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ValueReportComputationOptions _defaults =
        computationOptions?.Value ?? throw new ArgumentNullException(nameof(computationOptions));

    private readonly ITenantCostSettingsRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantCostSettingsGetResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantCostSettingsRecord? row = await _repository.TryGetAsync(scope.TenantId, cancellationToken);

        return Ok(ProjectResponse(row));
    }

    [HttpPut]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(TenantCostSettingsGetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PutAsync(
        [FromBody] TenantCostSettingsPutRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (body.ArchitectHourlyRateUsd is <= 0m or > 10_000m)
        {
            return this.BadRequestProblem(
                "Architect hourly rate must be between 0 and 10,000 (exclusive of zero).",
                ProblemTypes.ValidationFailed);
        }

        if (body.AverageIncidentCostUsd is <= 0m or > 10_000_000m)
        {
            return this.BadRequestProblem(
                "Average incident cost must be between 0 and 10,000,000 (exclusive of zero).",
                ProblemTypes.ValidationFailed);
        }

        if (body.EaDiscountMultiplier is <= 0m or > 1m)
        {
            return this.BadRequestProblem(
                "EA discount multiplier must be between 0 (exclusive) and 1 (inclusive).",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string actor = User.Identity?.Name ?? "operator";
        DateTimeOffset updatedUtc = TimeProvider.System.GetUtcNow();

        TenantCostSettingsRecord record = new()
        {
            TenantId = scope.TenantId,
            ArchitectHourlyRateUsd = body.ArchitectHourlyRateUsd,
            AverageIncidentCostUsd = body.AverageIncidentCostUsd,
            EaDiscountMultiplier = body.EaDiscountMultiplier,
            UpdatedUtc = updatedUtc,
            UpdatedByActorId = actor,
        };

        await _repository.UpsertAsync(record, cancellationToken);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantCostSettingsUpdated,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        architectHourlyRateUsd = record.ArchitectHourlyRateUsd,
                        averageIncidentCostUsd = record.AverageIncidentCostUsd,
                        eaDiscountMultiplier = record.EaDiscountMultiplier,
                        savingsPricingBasis = ExecutiveRoiSavingsPricingBasis.Resolve(record.EaDiscountMultiplier),
                        updatedUtc = updatedUtc,
                    }),
            },
            cancellationToken);

        return Ok(ProjectResponse(record));
    }

    private TenantCostSettingsGetResponse ProjectResponse(TenantCostSettingsRecord? row)
    {
        if (row is null)
        {
            return new TenantCostSettingsGetResponse
            {
                ArchitectHourlyRateUsd = _defaults.FullyLoadedArchitectHourlyUsd,
                AverageIncidentCostUsd = _defaults.DefaultAverageIncidentCostUsd,
                EaDiscountMultiplier = 1.0m,
                IsTenantConfigured = false,
                UpdatedUtc = null,
            };
        }

        return new TenantCostSettingsGetResponse
        {
            ArchitectHourlyRateUsd = row.ArchitectHourlyRateUsd,
            AverageIncidentCostUsd = row.AverageIncidentCostUsd,
            EaDiscountMultiplier = row.EaDiscountMultiplier <= 0m ? 1.0m : row.EaDiscountMultiplier,
            IsTenantConfigured = true,
            UpdatedUtc = row.UpdatedUtc,
        };
    }
}
