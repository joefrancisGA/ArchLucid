using ArchLucid.Api.Support;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Findings.FindingVerification;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Coordination.Compare;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Run detail page bundles to collapse first-paint and timeline fan-out.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/authority/reviews/{runId:guid}")]
[EnableRateLimiting("fixed")]
public sealed partial class RunDetailPageBundleController(
    IAuthorityQueryService queryService,
    IAuthorityRunDetailOperatorEnricher runDetailOperatorEnricher,
    IArtifactQueryService artifactQueryService,
    IFindingVerificationReportQueryService findingVerificationReportQueryService,
    IRunPipelineAuditTimelineService pipelineAuditTimeline,
    IRunRepository runRepository,
    IRunStageOutcomesRepository runStageOutcomesRepository,
    IAuthorityCompareService compareService,
    ICompareRunsApplicationFacade compareRunsFacade,
    IScopeContextProvider scopeProvider,
    IManifestHashService manifestHashService,
    IConfiguration configuration,
    IEffectiveAgentExecutionModeAccessor effectiveAgentExecutionModeAccessor,
    ILogger<RunDetailPageBundleController> logger) : ControllerBase
{
    private const int DeferredProjectRunTake = 60;
    private readonly IAuthorityQueryService _queryService =
        queryService ?? throw new ArgumentNullException(nameof(queryService));

    private readonly IAuthorityRunDetailOperatorEnricher _runDetailOperatorEnricher =
        runDetailOperatorEnricher ?? throw new ArgumentNullException(nameof(runDetailOperatorEnricher));

    private readonly IArtifactQueryService _artifactQueryService =
        artifactQueryService ?? throw new ArgumentNullException(nameof(artifactQueryService));

    private readonly IFindingVerificationReportQueryService _findingVerificationReportQueryService =
        findingVerificationReportQueryService
        ?? throw new ArgumentNullException(nameof(findingVerificationReportQueryService));

    private readonly IRunPipelineAuditTimelineService _pipelineAuditTimeline =
        pipelineAuditTimeline ?? throw new ArgumentNullException(nameof(pipelineAuditTimeline));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    private readonly IAuthorityCompareService _compareService =
        compareService ?? throw new ArgumentNullException(nameof(compareService));

    private readonly ICompareRunsApplicationFacade _compareRunsFacade =
        compareRunsFacade ?? throw new ArgumentNullException(nameof(compareRunsFacade));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IEffectiveAgentExecutionModeAccessor _effectiveAgentExecutionModeAccessor =
        effectiveAgentExecutionModeAccessor ?? throw new ArgumentNullException(nameof(effectiveAgentExecutionModeAccessor));

    private readonly ILogger<RunDetailPageBundleController> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));
}
