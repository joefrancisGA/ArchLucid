using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Exports;

/// <summary>Loads latest trail-backed architect restatements for run export surfaces (LP-15).</summary>
public static class FindingArchitectRestatementExportMaterialLoader
{
    public static async Task<IReadOnlyList<FindingArchitectRestatementExportRow>> LoadForRunAsync(
        ArchitectureRunDetail detail,
        IFindingReviewTrailRepository trailRepository,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(trailRepository);
        ArgumentNullException.ThrowIfNull(scope);

        List<ArchitectureFinding> findings = [];

        foreach (AgentResult result in detail.Results ?? [])
        {
            foreach (ArchitectureFinding finding in result.Findings ?? [])
            {
                if (finding is null || string.IsNullOrWhiteSpace(finding.FindingId))
                {
                    continue;
                }

                findings.Add(finding);
            }
        }

        if (findings.Count == 0)
        {
            return [];
        }

        List<string> findingIds = findings
            .Select(static finding => finding.FindingId)
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (findingIds.Count == 0)
        {
            return [];
        }

        IReadOnlyList<FindingReviewEventRecord> events = await trailRepository
            .ListForFindingIdsSinceUtcAsync(scope.TenantId, findingIds, DateTimeOffset.MinValue, cancellationToken)
            .ConfigureAwait(false);

        Dictionary<string, ArchitectureFinding> findingById = findings
            .Where(static finding => !string.IsNullOrWhiteSpace(finding.FindingId))
            .GroupBy(static finding => finding.FindingId.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.OrdinalIgnoreCase);

        List<FindingArchitectRestatementExportRow> rows = [];

        foreach (string findingId in findingIds)
        {
            FindingReviewEventRecord? latest = events
                .Where(record =>
                    record.WorkspaceId == scope.WorkspaceId
                    && record.ProjectId == scope.ProjectId
                    && string.Equals(record.FindingId, findingId, StringComparison.OrdinalIgnoreCase)
                    && !string.IsNullOrWhiteSpace(record.ArchitectRestatement))
                .OrderByDescending(static record => record.OccurredAtUtc)
                .FirstOrDefault();

            if (latest is null || string.IsNullOrWhiteSpace(latest.ArchitectRestatement))
            {
                continue;
            }

            findingById.TryGetValue(findingId, out ArchitectureFinding? finding);

            string? findingTitle = finding is null
                ? null
                : string.IsNullOrWhiteSpace(finding.Message) ? finding.Category : finding.Message.Trim();

            rows.Add(new FindingArchitectRestatementExportRow
            {
                FindingId = findingId,
                FindingTitle = findingTitle,
                Restatement = latest.ArchitectRestatement.Trim(),
                OccurredAtUtc = latest.OccurredAtUtc,
                IsTrailBacked = true,
            });
        }

        return rows
            .OrderByDescending(static row => row.OccurredAtUtc)
            .ToList();
    }
}
