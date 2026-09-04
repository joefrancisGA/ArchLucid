using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>
///     Deferred ROI baseline fields on <c>dbo.Tenants</c> for the tenant in <see cref="IScopeContextProvider" /> scope
///     (manual prep, review-cycle anchor hours).
/// </summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/baseline")]
public sealed partial class TenantBaselineController(
    ITenantRepository tenantRepository,
    IScopeContextProvider scopeProvider,
    IAuditService auditService) : ControllerBase
{
    private readonly IAuditService
        _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private static TenantBaselineGetResponse ProjectBaselineResponse(TenantRecord tenant)
    {
        return new TenantBaselineGetResponse
        {
            ManualPrepHoursPerReview = tenant.BaselineManualPrepHoursPerReview,
            PeoplePerReview = tenant.BaselinePeoplePerReview,
            CapturedUtc = tenant.BaselineManualPrepCapturedUtc,
            BaselineReviewCycleHours = tenant.BaselineReviewCycleHours,
            BaselineReviewCycleSource = tenant.BaselineReviewCycleSource,
            BaselineReviewCycleCapturedUtc = tenant.BaselineReviewCycleCapturedUtc
        };
    }
}
