using ArchLucid.Api.Attributes;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Explanation.Models;
using ArchLucid.Application.Analysis;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Queries;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Planning;

/// <summary>
///     LLM explanations for a single run (with optional provenance) and for manifest deltas between two runs.
/// </summary>
/// <remarks>
///     Routes under <c>api/explain</c>; uses <see cref="IExplanationService" /> and <see cref="IComparisonService" />
///     for compare narrative.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/explain")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class ExplanationController(
    IAuthorityQueryService query,
    ICompareRunsApplicationFacade compareRunsFacade,
    IExplanationService explanation,
    IRunExplanationSummaryService runExplanationSummary,
    IFindingExplainabilityComposer findingExplainabilityComposer,
    IFindingLlmAuditService findingLlmAudit,
    IProvenanceSnapshotRepository provenanceRepo,
    IScopeContextProvider scopeProvider,
    IHolisticCriticService holisticCriticService,
    IManifestHashService manifestHashService,
    ILogger<ExplanationController> logger)
    : ControllerBase
{
    private readonly ILogger<ExplanationController> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));
}
