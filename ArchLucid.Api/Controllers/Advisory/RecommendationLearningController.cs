using ArchLucid.Api.Attributes;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Advisory;

/// <summary>
///     Reads and rebuilds <see cref="RecommendationLearningProfile" /> aggregates for the caller’s scope
///     (acceptance/rejection patterns by category, urgency, etc.).
/// </summary>
/// <remarks>
///     Profiles feed composite alert metrics (acceptance rate via <c>AlertMetricSnapshotBuilder</c>) and advisory UX.
///     Rebuild scans recent recommendation rows via
///     <c>RecommendationLearningService</c>. Routes: <c>api/recommendation-learning</c>.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/recommendation-learning")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class RecommendationLearningController(
    IRecommendationLearningService learningService,
    IRecommendationLearningOperationalService operationalService,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    IHostEnvironment hostEnvironment) : ControllerBase;
