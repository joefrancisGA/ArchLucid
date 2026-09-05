using ArchLucid.Api.Attributes;
using ArchLucid.Application.Advisory;
using ArchLucid.Application.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Queries;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Advisory;

/// <summary>
///     CRON-style advisory scan schedules, on-demand runs, execution history, and persisted architecture digests for the
///     caller's scope.
/// </summary>
/// <remarks>
///     <see cref="IAdvisoryScanRunner.RunScheduleAsync" /> loads effective governance once per successful scan, merges
///     advisory defaults into the plan,
///     and drives alert evaluation (see <c>docs/API_CONTRACTS.md</c> and the governance piece tracker in
///     <c>docs/METHOD_DOCUMENTATION.md</c>). Routes: <c>api/advisory-scheduling</c>.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/advisory-scheduling")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class AdvisorySchedulingController(
    IScopeContextProvider scopeProvider,
    IAdvisoryScanScheduleRepository scheduleRepository,
    IAdvisoryScanExecutionRepository executionRepository,
    IArchitectureDigestRepository digestRepository,
    IAdvisoryScanRunner scanRunner,
    IScanScheduleCalculator scheduleCalculator,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    IAuditService auditService)
    : ControllerBase
{
    private static bool MatchesScope(AdvisoryScanSchedule schedule, ScopeContext scope)
    {
        return schedule.TenantId == scope.TenantId &&
               schedule.WorkspaceId == scope.WorkspaceId &&
               schedule.ProjectId == scope.ProjectId;
    }
}
