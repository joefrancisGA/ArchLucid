using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using FluentValidation;
using FluentValidation.Results;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Run-to-run comparison endpoints (agents, end-to-end replay compare).</summary>
[ApiController]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class RunComparisonController(
    ICompareRunsApplicationFacade compareRunsFacade,
    IAgentResultDiffSummaryFormatter agentResultDiffSummaryFormatter,
    IEndToEndReplayComparisonService endToEndReplayComparisonService,
    IEndToEndReplayComparisonSummaryFormatter endToEndReplayComparisonSummaryFormatter,
    IEndToEndReplayComparisonExportService endToEndReplayComparisonExportService,
    IComparisonAuditService comparisonAuditService,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    IValidator<RunPairQuery> runPairQueryValidator)
    : ControllerBase
{
    private readonly ICompareRunsApplicationFacade _compareRunsFacade =
        compareRunsFacade ?? throw new ArgumentNullException(nameof(compareRunsFacade));

    private readonly IAgentResultDiffSummaryFormatter _agentResultDiffSummaryFormatter =
        agentResultDiffSummaryFormatter ?? throw new ArgumentNullException(nameof(agentResultDiffSummaryFormatter));

    private readonly IEndToEndReplayComparisonService _endToEndReplayComparisonService =
        endToEndReplayComparisonService ?? throw new ArgumentNullException(nameof(endToEndReplayComparisonService));

    private readonly IEndToEndReplayComparisonSummaryFormatter _endToEndReplayComparisonSummaryFormatter =
        endToEndReplayComparisonSummaryFormatter
        ?? throw new ArgumentNullException(nameof(endToEndReplayComparisonSummaryFormatter));

    private readonly IEndToEndReplayComparisonExportService _endToEndReplayComparisonExportService =
        endToEndReplayComparisonExportService
        ?? throw new ArgumentNullException(nameof(endToEndReplayComparisonExportService));

    private readonly IComparisonAuditService _comparisonAuditService =
        comparisonAuditService ?? throw new ArgumentNullException(nameof(comparisonAuditService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IValidator<RunPairQuery> _runPairQueryValidator =
        runPairQueryValidator ?? throw new ArgumentNullException(nameof(runPairQueryValidator));

    private async Task<IActionResult?> ValidateRunPairQueryAsync(RunPairQuery query,
        CancellationToken cancellationToken)
    {
        ValidationResult? validation = await _runPairQueryValidator.ValidateAsync(query, cancellationToken);
        if (!validation.IsValid)
            return this.BadRequestProblem(
                string.Join(" ", validation.Errors.Select(e => e.ErrorMessage)),
                ProblemTypes.ValidationFailed);

        return null;
    }
}
