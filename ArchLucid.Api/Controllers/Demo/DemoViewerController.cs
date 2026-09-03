using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Trust;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Coordination.Compare;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Demo;

using ArchLucid.Api.Security;

/// <summary>
///     Read-only anonymous viewer for Contoso demo-seeded data when <c>Demo:AnonymousViewer:Enabled</c> is true.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/demo/viewer")]
[EnableRateLimiting("fixed")]
[AllowAnonymous]
[AllowUnscopedRoute]
public sealed partial class DemoViewerController(
    IOptions<DemoOptions> demoOptions,
    IRunDetailQueryService runDetailQueryService,
    IArchitectureRunProvenanceService architectureRunProvenanceService,
    IAuthorityCompareService authorityCompareService,
    IRunTrustEvidenceCardBuilder trustEvidenceCardBuilder,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    ILlmCostEstimator llmCostEstimator,
    IEffectiveAgentExecutionModeAccessor effectiveAgentExecutionModeAccessor) : ControllerBase;
