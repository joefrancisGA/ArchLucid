using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Billing;
using ArchLucid.Contracts.Billing;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Tenant-scoped estimated LLM cost reporting (Batch B item 18).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant")]
public sealed class TenantLlmCostReportingController(
    ITenantLlmCostReportingService reportingService,
    IScopeContextProvider scopeProvider,
    ITenantRepository tenantRepository) : ControllerBase
{
    private const int MaxDays = 90;

    private readonly ITenantLlmCostReportingService _reportingService =
        reportingService ?? throw new ArgumentNullException(nameof(reportingService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    [HttpGet("llm-cost-reporting")]
    [ProducesResponseType(typeof(LlmCostReportingDashboardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] int days = 30,
        CancellationToken cancellationToken = default)
    {
        if (days is < 1 or > MaxDays)
        {
            return this.BadRequestProblem(
                $"days must be between 1 and {MaxDays}.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        LlmCostReportingDashboardResponse dashboard =
            await _reportingService.BuildDashboardAsync(days, cancellationToken).ConfigureAwait(false);

        return Ok(dashboard);
    }
}
