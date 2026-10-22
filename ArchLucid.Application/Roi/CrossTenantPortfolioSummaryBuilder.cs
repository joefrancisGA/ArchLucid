using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Builds a cross-tenant portfolio summary for the calling user, aggregating metrics across
///     all tenants they have access to. Enforces k-anonymity (k >= 5).
/// </summary>
public sealed class CrossTenantPortfolioSummaryBuilder(
    SponsorRoiRunCollector runCollector,
    ITenantRepository tenantRepository,
    IScimUserRepository scimUserRepository,
    ILogger<CrossTenantPortfolioSummaryBuilder> logger)
{
    private readonly SponsorRoiRunCollector _runCollector =
        runCollector ?? throw new ArgumentNullException(nameof(runCollector));

    private readonly ITenantRepository _tenantRepository = tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));
    private readonly IScimUserRepository _scimUserRepository = scimUserRepository ?? throw new ArgumentNullException(nameof(scimUserRepository));

    private readonly ILogger<CrossTenantPortfolioSummaryBuilder> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<CrossTenantPortfolioSummaryResponse> GetCrossTenantPortfolioSummaryAsync(
        string userDirectoryKey,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<TenantRecord> allTenants = await _tenantRepository.ListAsync(cancellationToken).ConfigureAwait(false);
        List<Guid> accessibleTenantIds = [];

        foreach (TenantRecord tenant in allTenants)
        {
            if (tenant.SuspendedUtc is not null || tenant.OffboardedUtc is not null)
                continue;

            ScimUserRecord? user = await _scimUserRepository.GetByExternalIdAsync(tenant.Id, userDirectoryKey, cancellationToken).ConfigureAwait(false);
            if (user is not null && user.DirectoryRemovedUtc is null && user.Active)
            {
                accessibleTenantIds.Add(tenant.Id);
            }
        }

        if (accessibleTenantIds.Count < 5)
        {
            return new CrossTenantPortfolioSummaryResponse
            {
                IsKAnonymitySatisfied = false
            };
        }

        decimal totalSavings = 0m;
        int totalSystems = 0;
        int totalCriticalFindings = 0;
        List<SystemicIssueSummary> allIssues = [];

        foreach (Guid tenantId in accessibleTenantIds)
        {
            using IDisposable overrideScope = AmbientScopeContext.Push(new ScopeContext { TenantId = tenantId });

            Dictionary<string, RunSummary> latestBySystem =
                await _runCollector.CollectLatestCommittedRunPerSystemAsync(cancellationToken).ConfigureAwait(false);
            List<RunSummary> selectedSummaries = latestBySystem.Values
                .OrderByDescending(static summary => summary.CreatedUtc)
                .Take(SponsorRoiRunCollector.DefaultSystemDetailCap)
                .ToList();

            List<(RunSummary Summary, ArchitectureRunDetail Detail)> loaded =
                await _runCollector.LoadRoiRunDetailsOrderedAsync(selectedSummaries, cancellationToken).ConfigureAwait(false);
            List<ArchitectureRunDetail> latestDetails = loaded.Select(static pair => pair.Detail).ToList();

            SponsorRoiBasisBreakdown tenantBasis = await _runCollector.BuildBasisBreakdownAsync(
                latestDetails,
                tenantId,
                projectId: null,
                cancellationToken).ConfigureAwait(false);

            totalSavings += SponsorRoiRunCollector.ComputeHeadlineSavingsFromBasis(tenantBasis);
            totalSystems += latestDetails.Count;

            IEnumerable<ArchitectureFinding> allFindings = latestDetails
                .SelectMany(static detail => detail.Results.SelectMany(static result => result.Findings));

            SponsorRoiFindingExclusionLogger.LogMutedFindings(_logger, allFindings.Where(static f => f.IsMuted));

            IEnumerable<ArchitectureFinding> activeFindings = allFindings.Where(static finding => !finding.IsMuted);

            IEnumerable<ArchitectureFinding> deduped =
                SponsorRoiFindingExclusionLogger.DeduplicateWithLogging(_logger, activeFindings);

            totalCriticalFindings += deduped.Count(static f => string.Equals(f.Severity.ToString(), "Critical", StringComparison.OrdinalIgnoreCase));

            IEnumerable<SystemicIssueSummary> issues = deduped
                .GroupBy(static finding => (Category: SponsorRoiRunCollector.NormalizeCategory(finding.Category), Severity: finding.Severity.ToString()))
                .Select(static group => new SystemicIssueSummary
                {
                    Category = group.Key.Category,
                    Severity = group.Key.Severity,
                    Count = group.Count(),
                });

            allIssues.AddRange(issues);
        }

        List<SystemicIssueSummary> topIssues = allIssues
            .GroupBy(static issue => (issue.Category, issue.Severity))
            .Select(static group => new SystemicIssueSummary
            {
                Category = group.Key.Category,
                Severity = group.Key.Severity,
                Count = group.Sum(static i => i.Count),
            })
            .OrderByDescending(static issue => issue.Count)
            .ThenBy(static issue => issue.Category, StringComparer.OrdinalIgnoreCase)
            .ThenBy(static issue => issue.Severity, StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();

        CrossTenantPortfolioSummaryResponse response = new()
        {
            IsKAnonymitySatisfied = true,
            TotalEstimatedUsdSavings = totalSavings,
            TotalSystemCount = totalSystems,
            TotalCriticalFindings = totalCriticalFindings,
            TopSystemicIssues = topIssues,
        };

        RoiSponsorFacingScopeLabeler.ApplyCrossTenantPortfolio(response);

        return response;
    }
}
