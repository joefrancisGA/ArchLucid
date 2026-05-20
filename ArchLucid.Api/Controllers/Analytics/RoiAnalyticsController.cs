using ArchLucid.Api.Models.Analytics;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Analytics;

/// <summary>Executive ROI analytics (aggregates). Data is mocked until the ROI data model is finalized.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/analytics")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class RoiAnalyticsController : ControllerBase
{
    /// <summary>Returns mocked aggregate ROI metrics for executive dashboards.</summary>
    [HttpGet("roi")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(ExecutiveRoiAggregatesResponse), StatusCodes.Status200OK)]
    public ActionResult<ExecutiveRoiAggregatesResponse> GetRoiAggregates()
    {
        ExecutiveRoiAggregatesResponse body = new()
        {
            TimeSavedHours = 142.5,
            DecisionsAutomated = 1840,
            ComplianceRisksMitigated = 37,
        };

        return Ok(body);
    }

    /// <summary>
    ///     Returns portfolio ROI rollup with unique-identity dedupe across mocked per-run findings.
    /// </summary>
    [HttpGet("roi/portfolio-summary")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PortfolioRoiSummaryResponse), StatusCodes.Status200OK)]
    public ActionResult<PortfolioRoiSummaryResponse> GetPortfolioSummary()
    {
        IReadOnlyList<MockPortfolioFinding> findings = CreateMockPortfolioFindings();
        PortfolioRoiSummaryResponse body = BuildPortfolioSummary(findings);

        return Ok(body);
    }

    private static PortfolioRoiSummaryResponse BuildPortfolioSummary(IReadOnlyList<MockPortfolioFinding> findings)
    {
        ExecutiveRoiAggregatesResponse rawTotals = new()
        {
            TimeSavedHours = findings.Sum(static finding => finding.TimeSavedHours),
            DecisionsAutomated = findings.Sum(static finding => finding.DecisionsAutomated),
            ComplianceRisksMitigated = findings.Sum(static finding => finding.ComplianceRisksMitigated),
        };

        IEnumerable<MockPortfolioFinding> deduplicatedFindings = findings
            .GroupBy(static finding => BuildDedupeKey(finding.PolicyRuleId, finding.NormalizedFindingFingerprint))
            .Select(static group => group.First());

        List<MockPortfolioFinding> uniqueFindings = deduplicatedFindings.ToList();

        ExecutiveRoiAggregatesResponse deduplicatedTotals = new()
        {
            TimeSavedHours = uniqueFindings.Sum(static finding => finding.TimeSavedHours),
            DecisionsAutomated = uniqueFindings.Sum(static finding => finding.DecisionsAutomated),
            ComplianceRisksMitigated = uniqueFindings.Sum(static finding => finding.ComplianceRisksMitigated),
        };

        return new PortfolioRoiSummaryResponse
        {
            DeduplicatedTotals = deduplicatedTotals,
            RawRunTotals = rawTotals,
            UniqueFindingCount = uniqueFindings.Count,
            RawFindingCount = findings.Count,
        };
    }

    private static string BuildDedupeKey(string policyRuleId, string normalizedFindingFingerprint)
    {
        return $"{policyRuleId}:{normalizedFindingFingerprint}";
    }

    private static IReadOnlyList<MockPortfolioFinding> CreateMockPortfolioFindings()
    {
        return
        [
            new MockPortfolioFinding("rule-public-db", "public-sql-endpoint", "run-a", 12.5, 40, 2),
            new MockPortfolioFinding("rule-public-db", "public-sql-endpoint", "run-b", 12.5, 40, 2),
            new MockPortfolioFinding("rule-missing-waf", "edge-waf-absent", "run-a", 8.0, 25, 1),
            new MockPortfolioFinding("rule-missing-waf", "edge-waf-absent", "run-c", 8.0, 25, 1),
            new MockPortfolioFinding("rule-stale-cert", "expired-tls-cert", "run-b", 3.5, 10, 1),
        ];
    }

    private sealed record MockPortfolioFinding(
        string PolicyRuleId,
        string NormalizedFindingFingerprint,
        string RunId,
        double TimeSavedHours,
        int DecisionsAutomated,
        int ComplianceRisksMitigated);
}
