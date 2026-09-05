using ArchLucid.Contracts.Governance;

using Dapper;

namespace ArchLucid.Persistence.Governance;

public sealed partial class ArchitectureDecisionRegisterReader
{
    public async Task<IReadOnlyList<ArchitectureDecisionRegisterEntry>> ListAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid? projectId,
        int maxRows,
        ArchitectureDecisionRegisterQueryOptions? filters,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (workspaceId == Guid.Empty)
            throw new ArgumentException("Workspace id is required.", nameof(workspaceId));

        if (maxRows <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxRows));

        string projectFilter = projectId.HasValue ? " AND m.ProjectId = @ProjectId" : string.Empty;

        DynamicParameters parameters = new();
        parameters.Add("TenantId", tenantId);
        parameters.Add("WorkspaceId", workspaceId);

        if (projectId.HasValue)
            parameters.Add("ProjectId", projectId);

        parameters.Add("MaxRows", maxRows);

        string filterSql = AppendFilterParameters(filters, parameters);

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
                      WHERE m.TenantId = @TenantId AND m.WorkspaceId = @WorkspaceId{projectFilter}{filterSql}
                      ORDER BY m.CreatedUtc DESC, d.SortOrder ASC;
                      """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<DecisionRow> rows = await conn.QueryAsync<DecisionRow>(
            new CommandDefinition(sql, parameters, cancellationToken: cancellationToken));

        List<ArchitectureDecisionRegisterEntry> decisions = MapDecisionRows(rows);

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

        return EnrichWithEvidence(decisions, evidence);
    }
}
