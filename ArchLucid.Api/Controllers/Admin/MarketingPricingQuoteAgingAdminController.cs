using ArchLucid.Api.Models.Admin;
using ArchLucid.Contracts.Marketing;
using ArchLucid.Core.Authorization;
using ArchLucid.Persistence.Marketing;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Sales acknowledgement SLA snapshot for marketing pricing quote requests.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/marketing/pricing-quote-aging")]
public sealed class MarketingPricingQuoteAgingAdminController(
    IMarketingPricingQuoteRequestAgingReader agingReader) : ControllerBase
{
    private readonly IMarketingPricingQuoteRequestAgingReader _agingReader =
        agingReader ?? throw new ArgumentNullException(nameof(agingReader));

    /// <summary>Returns unanswered quote requests with age and SLA breach status.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(MarketingPricingQuoteAgingResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAgingAsync(CancellationToken cancellationToken)
    {
        IReadOnlyList<MarketingPricingQuoteRequestAgingRow> rows =
            await _agingReader.ListAsync(cancellationToken).ConfigureAwait(false);

        int warnCount = 0;
        int breachCount = 0;

        List<MarketingPricingQuoteAgingItemResponse> mapped = new(rows.Count);

        foreach (MarketingPricingQuoteRequestAgingRow row in rows)
        {
            if (string.Equals(row.BreachStatus, MarketingPricingQuoteRequestBreachStatus.WarnAt18Hours, StringComparison.Ordinal))
                warnCount++;

            if (string.Equals(row.BreachStatus, MarketingPricingQuoteRequestBreachStatus.BreachAt24Hours, StringComparison.Ordinal))
                breachCount++;

            mapped.Add(
                new MarketingPricingQuoteAgingItemResponse
                {
                    Id = row.Id,
                    CreatedUtc = row.CreatedUtc,
                    AgeHours = row.AgeHours,
                    BreachStatus = row.BreachStatus,
                    WorkEmail = row.WorkEmail,
                    CompanyName = row.CompanyName,
                    TierInterest = row.TierInterest,
                    Status = row.Status,
                    FirstResponseUtc = row.FirstResponseUtc,
                    AssignedOwner = row.AssignedOwner
                });
        }

        return Ok(
            new MarketingPricingQuoteAgingResponse
            {
                Rows = mapped,
                WarnCount = warnCount,
                BreachCount = breachCount
            });
    }
}
