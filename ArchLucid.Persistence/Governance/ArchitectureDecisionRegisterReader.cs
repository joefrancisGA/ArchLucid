using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.Governance;

/// <summary>SQL projection for the architecture decision register (TB-060).</summary>
public sealed class ArchitectureDecisionRegisterReader(ISqlConnectionFactory connectionFactory)
    : IArchitectureDecisionRegisterQuery
{
    public async Task<IReadOnlyList<ArchitectureDecisionRegisterEntry>> ListAsync(
        Guid tenantId,
        Guid? projectId,
        int maxRows,
        ArchitectureDecisionRegisterQueryOptions? filters,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (maxRows <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxRows));

        string projectFilter = projectId.HasValue ? " AND m.ProjectId = @ProjectId" : string.Empty;

        string sql = $"""
                      SELECT TOP (@MaxRows)
                             d.DecisionId,
                             d.Category,
                             d.Title,
                             d.SelectedOption,
                             d.Rationale,
                             d.Confidence,
                             d.ConfidenceSource,
                             m.ManifestId,
                             m.RunId,
                             m.CreatedUtc AS RecordedAtUtc
                      FROM dbo.GoldenManifestDecisions AS d
                      INNER JOIN dbo.GoldenManifests AS m ON m.ManifestId = d.ManifestId
                      WHERE m.TenantId = @TenantId{projectFilter}
                      ORDER BY m.CreatedUtc DESC, d.SortOrder ASC;
                      """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<DecisionRow> rows = await conn.QueryAsync<DecisionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, ProjectId = projectId, MaxRows = maxRows },
                cancellationToken: cancellationToken));

        List<ArchitectureDecisionRegisterEntry> decisions = [];

        foreach (DecisionRow row in rows)
        {
            decisions.Add(
                new ArchitectureDecisionRegisterEntry
                {
                    DecisionId = row.DecisionId,
                    ManifestId = row.ManifestId,
                    RunId = row.RunId,
                    Category = row.Category,
                    Title = row.Title,
                    SelectedOption = row.SelectedOption,
                    Rationale = row.Rationale,
                    Confidence = row.Confidence,
                    ConfidenceSource = row.ConfidenceSource,
                    BuyerConfidenceSource = DecisionConfidenceSourceMapper.ToBuyerLabel(row.ConfidenceSource),
                    RecordedAtUtc = new DateTimeOffset(DateTime.SpecifyKind(row.RecordedAtUtc, DateTimeKind.Utc)),
                    SupportingFindingIds = [],
                });
        }

        if (decisions.Count == 0)
            return decisions;

        List<Guid> manifestIds = decisions.Select(static d => d.ManifestId).Distinct().ToList();

        const string evidenceSql = """
                                   SELECT el.ManifestId, el.DecisionId, el.FindingId
                                   FROM dbo.GoldenManifestDecisionEvidenceLinks AS el
                                   WHERE el.ManifestId IN @ManifestIds
                                   ORDER BY el.ManifestId, el.DecisionId, el.SortOrder;
                                   """;

        IEnumerable<EvidenceRow> evidence = await conn.QueryAsync<EvidenceRow>(
            new CommandDefinition(evidenceSql, new { ManifestIds = manifestIds }, cancellationToken: cancellationToken));

        Dictionary<string, List<string>> byManifestDecision = new(StringComparer.OrdinalIgnoreCase);

        foreach (EvidenceRow er in evidence)
        {
            string key = $"{er.ManifestId:N}|{er.DecisionId}";

            if (!byManifestDecision.TryGetValue(key, out List<string>? list))
            {
                list = [];
                byManifestDecision[key] = list;
            }

            list.Add(er.FindingId);
        }

        List<ArchitectureDecisionRegisterEntry> enriched = [];

        foreach (ArchitectureDecisionRegisterEntry decision in decisions)
        {
            string key = $"{decision.ManifestId:N}|{decision.DecisionId}";
            byManifestDecision.TryGetValue(key, out List<string>? findingIds);
            findingIds ??= [];

            enriched.Add(
                new ArchitectureDecisionRegisterEntry
                {
                    DecisionId = decision.DecisionId,
                    ManifestId = decision.ManifestId,
                    RunId = decision.RunId,
                    Category = decision.Category,
                    Title = decision.Title,
                    SelectedOption = decision.SelectedOption,
                    Rationale = decision.Rationale,
                    Confidence = decision.Confidence,
                    ConfidenceSource = decision.ConfidenceSource,
                    BuyerConfidenceSource = decision.BuyerConfidenceSource,
                    RecordedAtUtc = decision.RecordedAtUtc,
                    SupportingFindingIds = findingIds,
                });
        }

        return ApplyFilters(enriched, filters);
    }

    private static IReadOnlyList<ArchitectureDecisionRegisterEntry> ApplyFilters(
        IReadOnlyList<ArchitectureDecisionRegisterEntry> decisions,
        ArchitectureDecisionRegisterQueryOptions? filters)
    {
        if (filters is null)
            return decisions;

        IEnumerable<ArchitectureDecisionRegisterEntry> query = decisions;

        if (!string.IsNullOrWhiteSpace(filters.Category))
        {
            string category = filters.Category.Trim();

            query = query.Where(d => string.Equals(d.Category, category, StringComparison.OrdinalIgnoreCase));
        }

        if (filters.RecordedAfterUtc is not null)
            query = query.Where(d => d.RecordedAtUtc >= filters.RecordedAfterUtc);

        if (filters.RecordedBeforeUtc is not null)
            query = query.Where(d => d.RecordedAtUtc <= filters.RecordedBeforeUtc);

        if (filters.MinConfidence is not null)
            query = query.Where(d => d.Confidence is not null && d.Confidence >= filters.MinConfidence);

        if (filters.MaxConfidence is not null)
            query = query.Where(d => d.Confidence is not null && d.Confidence <= filters.MaxConfidence);

        if (!string.IsNullOrWhiteSpace(filters.BuyerConfidenceSource))
        {
            string label = filters.BuyerConfidenceSource.Trim();

            query = query.Where(d =>
                string.Equals(d.BuyerConfidenceSource, label, StringComparison.OrdinalIgnoreCase));
        }

        return query.ToList();
    }

    private sealed class DecisionRow
    {
        public string DecisionId
        {
            get;
            init;
        } = string.Empty;

        public string Category
        {
            get;
            init;
        } = string.Empty;

        public string Title
        {
            get;
            init;
        } = string.Empty;

        public string SelectedOption
        {
            get;
            init;
        } = string.Empty;

        public string Rationale
        {
            get;
            init;
        } = string.Empty;

        public double? Confidence
        {
            get;
            init;
        }

        public string? ConfidenceSource
        {
            get;
            init;
        }

        public Guid ManifestId
        {
            get;
            init;
        }

        public Guid RunId
        {
            get;
            init;
        }

        public DateTime RecordedAtUtc
        {
            get;
            init;
        }
    }

    private sealed class EvidenceRow
    {
        public Guid ManifestId
        {
            get;
            init;
        }

        public string DecisionId
        {
            get;
            init;
        } = string.Empty;

        public string FindingId
        {
            get;
            init;
        } = string.Empty;
    }
}
