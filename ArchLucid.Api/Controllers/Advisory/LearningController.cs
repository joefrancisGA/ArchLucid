using ArchLucid.Api.Attributes;
using ArchLucid.Api.Learning;
using ArchLucid.Api.Services;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Advisory;

/// <summary>
///     59R learning-to-planning APIs: themes, improvement plans, deterministic materialization, exports, and KPIs.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/learning")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class LearningController(
    ILearningPlanningReadService learningReadService,
    IProductLearningPlanningDerivationService planningDerivationService,
    IActorContext actorContext,
    IScopeContextProvider scopeProvider,
    IAuditService auditService)
    : ControllerBase
{
    private static ProductLearningScope ToProductLearningScope(ScopeContext scopeContext)
    {
        return scopeContext is null
            ? throw new ArgumentNullException(nameof(scopeContext))
            : new ProductLearningScope
            {
                TenantId = scopeContext.TenantId,
                WorkspaceId = scopeContext.WorkspaceId,
                ProjectId = scopeContext.ProjectId
            };
    }
}
