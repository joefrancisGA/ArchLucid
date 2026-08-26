using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Attributes;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Coordination.ProductLearning;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Advisory;

/// <summary>
///     Scoped read APIs for pilot feedback rollups: dashboard KPIs, improvement opportunities, artifact trends, and triage
///     queue slices.
/// </summary>
/// <remarks>
///     Base route <c>v1/product-learning</c>. Aligns with <see cref="ProductLearningScope" /> from
///     <see cref="IScopeContextProvider" />.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/product-learning")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class ProductLearningController(
    IProductLearningDashboardService dashboardService,
    IProductLearningPilotSignalRepository pilotSignalRepository,
    IActorContext actorContext,
    IScopeContextProvider scopeProvider,
    IAuditService auditService)
    : ControllerBase
{
    private static readonly JsonSerializerOptions ReportFileJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = true
    };

    private static ProductLearningScope ToProductLearningScope(ScopeContext scopeContext)
    {
        if (scopeContext is null) throw new ArgumentNullException(nameof(scopeContext));

        return new ProductLearningScope
        {
            TenantId = scopeContext.TenantId,
            WorkspaceId = scopeContext.WorkspaceId,
            ProjectId = scopeContext.ProjectId
        };
    }
}
