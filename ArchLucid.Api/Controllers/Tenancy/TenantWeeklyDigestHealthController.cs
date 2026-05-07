using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Application.Advisory;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Advisory schedules, digest subscriptions, and executive digest coverage for weekly operating health.</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/operate/weekly-digest-health")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class TenantWeeklyDigestHealthController(
    IScopeContextProvider scopeProvider,
    IWeeklyDigestHealthReader healthReader) : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IWeeklyDigestHealthReader _healthReader =
        healthReader ?? throw new ArgumentNullException(nameof(healthReader));

    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(WeeklyDigestHealthResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        WeeklyDigestHealthSnapshot snap =
            await _healthReader.GetSnapshotAsync(scope, cancellationToken).ConfigureAwait(false);

        WeeklyDigestHealthResponse body = new()
        {
            EnabledAdvisoryScheduleCount = snap.EnabledAdvisoryScheduleCount,
            EarliestNextAdvisoryRunUtc = snap.EarliestNextAdvisoryRunUtc,
            DigestSubscriptionCount = snap.DigestSubscriptionCount,
            EnabledDigestSubscriptionCount = snap.EnabledDigestSubscriptionCount,
            DigestSubscriptionsByEmailChannel = snap.DigestSubscriptionsByEmailChannel,
            DigestSubscriptionsBySlackChannel = snap.DigestSubscriptionsBySlackChannel,
            DigestSubscriptionsByTeamsChannel = snap.DigestSubscriptionsByTeamsChannel,
            LatestDigestSubscriptionDeliveryUtc = snap.LatestDigestSubscriptionDeliveryUtc,
            LatestArchitectureDigestId = snap.LatestArchitectureDigestId,
            LatestArchitectureDigestGeneratedUtc = snap.LatestArchitectureDigestGeneratedUtc,
            ExecutiveEmailDigestIsConfigured = snap.ExecutiveEmailDigestIsConfigured,
            ExecutiveEmailDigestEnabled = snap.ExecutiveEmailDigestEnabled,
            ExecutiveDigestRecipientCount = snap.ExecutiveDigestRecipientCount,
            ExecutiveDigestIanaTimeZoneId = snap.ExecutiveDigestIanaTimeZoneId,
            ExecutiveDigestDayOfWeek = snap.ExecutiveDigestDayOfWeek,
            ExecutiveDigestHourOfDay = snap.ExecutiveDigestHourOfDay,
            SetupGaps = snap.SetupGaps,
        };

        return Ok(body);
    }
}
