using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models.Coverage;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.ProblemDetails;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Read-only coverage disclosure for a specific architecture run.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/runs")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
public sealed partial class RunCoverageController(
    ICoverageQueryService coverageQueryService,
    IRunCoverageAcknowledgementService acknowledgementService,
    IPolicyPackRepository policyPackRepository,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    private readonly IScopeContextProvider scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunCoverageAcknowledgementService acknowledgementService =
        acknowledgementService ?? throw new ArgumentNullException(nameof(acknowledgementService));
    [HttpGet("{runId:guid}/coverage")]
    [ProducesResponseType(typeof(RunCoverageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunCoverage(Guid runId, CancellationToken cancellationToken)
    {
        try
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            CoverageSummary summary = await coverageQueryService.GetByRunIdAsync(scope, runId, cancellationToken);
            Dictionary<Guid, PolicyPack> packById = await LoadPacksAsync(summary, cancellationToken);

            RunCoverageResponse response = new()
            {
                RunId = runId.ToString("N"),
                Summary = CoverageAssignmentMapper.ToSummaryResponse(summary, packById),
            };

            return Ok(response);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
    }

    private async Task<Dictionary<Guid, PolicyPack>> LoadPacksAsync(
        CoverageSummary summary,
        CancellationToken cancellationToken)
    {
        if (summary.Assignments.Count == 0)
            return new Dictionary<Guid, PolicyPack>();

        IReadOnlyList<PolicyPack> packs = await policyPackRepository.GetByIdsAsync(
            summary.Assignments.Select(static row => row.PolicyPackId).Distinct().ToList(),
            cancellationToken);

        return packs.ToDictionary(static pack => pack.PolicyPackId);
    }
}
