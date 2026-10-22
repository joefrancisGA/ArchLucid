using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.RelationalRead;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.GoldenManifests;

internal static partial class GoldenManifestPhase1RelationalRead
{
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

            DecisionConfidenceSource confidenceSource = RelationalSliceReadCore.ParseEnumOrDefault(
                dr.ConfidenceSource,
                DecisionConfidenceSource.Unknown);

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
