using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Data.Repositories;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

using AppConsultingDocxExportProfileSelector =
    ArchLucid.Application.Analysis.IConsultingDocxExportProfileSelector;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Builds and exports consolidated analysis reports for a committed run (markdown, DOCX, consulting templates, async
///     jobs).
/// </summary>
/// <remarks>
///     Uses <see cref="IArchitectureAnalysisService" /> for report assembly and <see cref="IRunDetailQueryService" /> for
///     run context.
///     Base route <c>v1/architecture</c> with <see cref="ArchLucidPolicies.ExecuteAuthority" />.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class AnalysisReportsController(
    IRunDetailQueryService runDetailQueryService,
    IArchitectureAnalysisService architectureAnalysisService,
    IArchitectureAnalysisExportService architectureAnalysisExportService,
    IArchitectureAnalysisDocxExportService docxExportService,
    IArchitectureAnalysisConsultingDocxExportService architectureAnalysisConsultingDocxExportService,
    IConsultingDocxTemplateRecommendationService consultingDocxTemplateRecommendationService,
    IConsultingDocxExportProfileSelector consultingDocxExportProfileSelector,
    IRunExportAuditService runExportAuditService,
    IRunExportRecordRepository runExportRecordRepository,
    IBackgroundJobQueue jobs,
    IAuditService auditService,
    ILogger<AnalysisReportsController> logger)
    : ControllerBase
{
    /// <summary>
    ///     Loads the canonical run detail for <paramref name="runId" />.
    ///     Returns a non-null <see cref="RunDetailLookup.Error" /> (404 problem) when the run is not found.
    /// </summary>
    private async Task<RunDetailLookup> LoadRunDetailOrNotFoundAsync(string runId, CancellationToken cancellationToken)
    {
        ArchitectureRunDetail? detail = await runDetailQueryService.GetRunDetailAsync(runId, cancellationToken);
        return detail is null
            ? new RunDetailLookup
            {
                Error = this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound)
            }
            : new RunDetailLookup { Detail = detail };
    }

    private sealed class RunDetailLookup
    {
        public IActionResult? Error
        {
            get;
            init;
        }

        public ArchitectureRunDetail? Detail
        {
            get;
            init;
        }
    }
}
