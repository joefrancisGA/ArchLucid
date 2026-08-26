using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Persistence.Serialization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.GoldenManifests;

internal static partial class GoldenManifestPhase1RelationalRead
{
    internal static async Task<ManifestDocument> HydrateAsync(
        SqlConnection connection,
        GoldenManifestStorageRow row,
        CancellationToken ct)
    {
        Guid manifestId = row.ManifestId;

        ManifestSliceCounts sliceCounts = await LoadSliceCountsAsync(connection, manifestId, ct);
        int assumptionsCount = sliceCounts.AssumptionsCount;
        int warningsCount = sliceCounts.WarningsCount;
        int decisionsCount = sliceCounts.DecisionsCount;
        int provFindingCount = sliceCounts.ProvenanceFindingCount;
        int provNodeCount = sliceCounts.ProvenanceNodeCount;
        int provRuleCount = sliceCounts.ProvenanceRuleCount;

        List<string> assumptions = assumptionsCount > 0
            ? await LoadOrderedStringsAsync(
                connection,
                """
                SELECT AssumptionText AS Item
                FROM dbo.GoldenManifestAssumptions
                WHERE ManifestId = @ManifestId
                ORDER BY SortOrder;
                """,
                manifestId,
                ct)
            : FallbackDeserializeList(row.AssumptionsJson);

        List<string> warnings = warningsCount > 0
            ? await LoadOrderedStringsAsync(
                connection,
                """
                SELECT WarningText AS Item
                FROM dbo.GoldenManifestWarnings
                WHERE ManifestId = @ManifestId
                ORDER BY SortOrder;
                """,
                manifestId,
                ct)
            : FallbackDeserializeList(row.WarningsJson);

        ManifestProvenance provenance = await LoadProvenanceRelationalAsync(
            connection,
            manifestId,
            provFindingCount,
            provNodeCount,
            provRuleCount,
            row.ProvenanceJson,
            ct);

        List<ResolvedArchitectureDecision> decisions = decisionsCount > 0
            ? await LoadDecisionsRelationalAsync(connection, manifestId, ct)
            : FallbackDeserializeDecisions(row.DecisionsJson);

        return new ManifestDocument
        {
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            ManifestId = row.ManifestId,
            RunId = row.RunId,
            ContextSnapshotId = row.ContextSnapshotId,
            GraphSnapshotId = row.GraphSnapshotId,
            FindingsSnapshotId = row.FindingsSnapshotId,
            DecisionTraceId = row.DecisionTraceId,
            CreatedUtc = row.CreatedUtc,
            ManifestHash = row.ManifestHash,
            RuleSetId = row.RuleSetId,
            RuleSetVersion = row.RuleSetVersion,
            RuleSetHash = row.RuleSetHash,
            Metadata = DeserializeOrNew(row.MetadataJson,
                static j => JsonEntitySerializer.Deserialize<ManifestMetadata>(j)),
            Requirements = DeserializeOrNew(
                row.RequirementsJson,
                static j => JsonEntitySerializer.Deserialize<RequirementsCoverageSection>(j)),
            Topology =
                DeserializeOrNew(row.TopologyJson, static j => JsonEntitySerializer.Deserialize<TopologySection>(j)),
            Security =
                DeserializeOrNew(row.SecurityJson, static j => JsonEntitySerializer.Deserialize<SecuritySection>(j)),
            Compliance = DeserializeCompliance(row.ComplianceJson),
            Cost = DeserializeOrNew(row.CostJson, static j => JsonEntitySerializer.Deserialize<CostSection>(j)),
            Constraints = DeserializeOrNew(
                row.ConstraintsJson,
                static j => JsonEntitySerializer.Deserialize<ConstraintSection>(j)),
            UnresolvedIssues = DeserializeOrNew(
                row.UnresolvedIssuesJson,
                static j => JsonEntitySerializer.Deserialize<UnresolvedIssuesSection>(j)),
            Decisions = decisions,
            Assumptions = assumptions,
            Warnings = warnings,
            Provenance = provenance
        };
    }

    private static async Task<List<ResolvedArchitectureDecision>> LoadDecisionsRelationalAsync(
        SqlConnection connection,
        Guid manifestId,
        CancellationToken ct)
    {
        const string decisionsSql = """
                                    SELECT SortOrder, DecisionId, Category, Title, SelectedOption, Rationale, RawDecisionJson,
                                           Confidence, ConfidenceSource
                                    FROM dbo.GoldenManifestDecisions
                                    WHERE ManifestId = @ManifestId
                                    ORDER BY SortOrder;
                                    """;

        List<ManifestDecisionRow> decisionRows = (await connection.QueryAsync<ManifestDecisionRow>(
            new CommandDefinition(
                decisionsSql,
                new { ManifestId = manifestId },
                cancellationToken: ct))).ToList();

        if (decisionRows.Count == 0)
            return [];

        const string evidenceSql = """
                                   SELECT DecisionId, SortOrder, FindingId
                                   FROM dbo.GoldenManifestDecisionEvidenceLinks
                                   WHERE ManifestId = @ManifestId
                                   ORDER BY DecisionId, SortOrder;
                                   """;

        List<DecisionEvidenceRow> evidenceRows = (await connection.QueryAsync<DecisionEvidenceRow>(
            new CommandDefinition(
                evidenceSql,
                new { ManifestId = manifestId },
                cancellationToken: ct))).ToList();

        const string nodeSql = """
                               SELECT DecisionId, SortOrder, NodeId
                               FROM dbo.GoldenManifestDecisionNodeLinks
                               WHERE ManifestId = @ManifestId
                               ORDER BY DecisionId, SortOrder;
                               """;

        List<DecisionNodeRow> nodeRows = (await connection.QueryAsync<DecisionNodeRow>(
            new CommandDefinition(
                nodeSql,
                new { ManifestId = manifestId },
                cancellationToken: ct))).ToList();

        Dictionary<string, List<string>> evidenceByDecision = new(StringComparer.Ordinal);

        foreach (DecisionEvidenceRow er in evidenceRows)
        {
            if (!evidenceByDecision.TryGetValue(er.DecisionId, out List<string>? list))
            {
                list = [];
                evidenceByDecision[er.DecisionId] = list;
            }

            list.Add(er.FindingId);
        }

        Dictionary<string, List<string>> nodesByDecision = new(StringComparer.Ordinal);

        foreach (DecisionNodeRow nr in nodeRows)
        {
            if (!nodesByDecision.TryGetValue(nr.DecisionId, out List<string>? list))
            {
                list = [];
                nodesByDecision[nr.DecisionId] = list;
            }

            list.Add(nr.NodeId);
        }

        List<ResolvedArchitectureDecision> result = [];

        foreach (ManifestDecisionRow dr in decisionRows)
        {
            evidenceByDecision.TryGetValue(dr.DecisionId, out List<string>? ev);
            ev ??= [];

            nodesByDecision.TryGetValue(dr.DecisionId, out List<string>? nodes);
            nodes ??= [];

            DecisionConfidenceSource confidenceSource = Enum.TryParse(
                dr.ConfidenceSource,
                ignoreCase: true,
                out DecisionConfidenceSource parsed)
                ? parsed
                : DecisionConfidenceSource.Unknown;

            result.Add(
                new ResolvedArchitectureDecision
                {
                    DecisionId = dr.DecisionId,
                    Category = dr.Category,
                    Title = dr.Title,
                    SelectedOption = dr.SelectedOption,
                    Rationale = dr.Rationale,
                    SupportingFindingIds = ev,
                    RelatedNodeIds = nodes,
                    RawDecisionJson = dr.RawDecisionJson,
                    Confidence = dr.Confidence,
                    ConfidenceSource = confidenceSource
                });
        }

        return result;
    }

    private static async Task<List<string>> LoadOrderedStringsAsync(
        SqlConnection connection,
        string sql,
        Guid manifestId,
        CancellationToken ct)
    {
        IEnumerable<string> rows = await connection.QueryAsync<string>(
            new CommandDefinition(
                sql,
                new { ManifestId = manifestId },
                cancellationToken: ct));

        return rows.ToList();
    }

    private static ComplianceSection DeserializeCompliance(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new ComplianceSection();

        try
        {
            return JsonEntitySerializer.Deserialize<ComplianceSection>(json) ?? new ComplianceSection();
        }
        catch (InvalidOperationException)
        {
            return new ComplianceSection();
        }
    }

    /// <summary>Shared JSON section deserialize used by full hydrate and prior-retrieval slim hydrate.</summary>
    internal static T DeserializeOrNew<T>(string? json, Func<string, T> deserialize)
        where T : class, new()
    {
        if (string.IsNullOrWhiteSpace(json))
            return new T();

        try
        {
            return deserialize(json) ?? new T();
        }
        catch (InvalidOperationException)
        {
            return new T();
        }
    }

    private sealed class ManifestDecisionRow
    {
        public int SortOrder
        {
            get;
            init;
        }

        public string DecisionId
        {
            get;
            init;
        } = null!;

        public string Category
        {
            get;
            init;
        } = null!;

        public string Title
        {
            get;
            init;
        } = null!;

        public string SelectedOption
        {
            get;
            init;
        } = null!;

        public string Rationale
        {
            get;
            init;
        } = null!;

        public string? RawDecisionJson
        {
            get;
            init;
        }

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
    }

    private sealed class DecisionEvidenceRow
    {
        public string DecisionId
        {
            get;
            init;
        } = null!;

        public int SortOrder
        {
            get;
            init;
        }

        public string FindingId
        {
            get;
            init;
        } = null!;
    }

    private static async Task<ManifestSliceCounts> LoadSliceCountsAsync(
        SqlConnection connection,
        Guid manifestId,
        CancellationToken ct)
    {
        // Single round-trip avoids parallel commands on one connection (MARS is off in production pools).
        const string sql = """
                           SELECT
                               (SELECT COUNT(1) FROM dbo.GoldenManifestAssumptions WHERE ManifestId = @ManifestId) AS AssumptionsCount,
                               (SELECT COUNT(1) FROM dbo.GoldenManifestWarnings WHERE ManifestId = @ManifestId) AS WarningsCount,
                               (SELECT COUNT(1) FROM dbo.GoldenManifestDecisions WHERE ManifestId = @ManifestId) AS DecisionsCount,
                               (SELECT COUNT(1) FROM dbo.GoldenManifestProvenanceSourceFindings WHERE ManifestId = @ManifestId) AS ProvenanceFindingCount,
                               (SELECT COUNT(1) FROM dbo.GoldenManifestProvenanceSourceGraphNodes WHERE ManifestId = @ManifestId) AS ProvenanceNodeCount,
                               (SELECT COUNT(1) FROM dbo.GoldenManifestProvenanceAppliedRules WHERE ManifestId = @ManifestId) AS ProvenanceRuleCount;
                           """;

        ManifestSliceCounts counts = await connection.QuerySingleAsync<ManifestSliceCounts>(
            new CommandDefinition(sql, new { ManifestId = manifestId }, cancellationToken: ct)).ConfigureAwait(false);

        return counts;
    }

    private sealed record ManifestSliceCounts(
        int AssumptionsCount,
        int WarningsCount,
        int DecisionsCount,
        int ProvenanceFindingCount,
        int ProvenanceNodeCount,
        int ProvenanceRuleCount);

    private sealed class DecisionNodeRow
    {
        public string DecisionId
        {
            get;
            init;
        } = null!;

        public int SortOrder
        {
            get;
            init;
        }

        public string NodeId
        {
            get;
            init;
        } = null!;
    }
}
