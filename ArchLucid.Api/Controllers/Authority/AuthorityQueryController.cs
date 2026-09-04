using ArchLucid.Api.Attributes;
using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application.Common;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Read-only HTTP surface for authority runs and golden-manifest summaries scoped to the caller’s
///     tenant/workspace/project.
/// </summary>
/// <remarks>
///     Delegates to <see cref="IAuthorityQueryService" />; routes under <c>api/authority</c>. Run detail returns
///     <see cref="RunDetailDto" /> directly (embedded domain models).
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/authority")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
public sealed partial class AuthorityQueryController(
    IAuthorityQueryService queryService,
    AuthorityRunReadHandlers readHandlers,
    IAuthorityRunDetailOperatorEnricher runDetailOperatorEnricher,
    IRunRetrievalGroundingService runRetrievalGroundingService,
    IScopeContextProvider scopeProvider,
    IActorContext actorContext,
    IRunOperatorGovernanceDispositionService runOperatorGovernanceDispositionService,
    IManifestHashService manifestHashService,
    IConfiguration configuration,
    IEffectiveAgentExecutionModeAccessor effectiveAgentExecutionModeAccessor,
    ILogger<AuthorityQueryController> logger) : ControllerBase
{
    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IEffectiveAgentExecutionModeAccessor _effectiveAgentExecutionModeAccessor =
        effectiveAgentExecutionModeAccessor ?? throw new ArgumentNullException(nameof(effectiveAgentExecutionModeAccessor));

    private readonly ILogger<AuthorityQueryController> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));
}
