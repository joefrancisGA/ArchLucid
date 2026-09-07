using System.Text;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Retrieval;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.AgentRuntime;

/// <summary>Builds bounded evidence summaries and allow-lists for the insight generator (DX-10, DX-17).</summary>
public static class InsightGeneratorEvidenceSummary
{
    /// <summary>
    ///     claimBoundary: community summaries are optional retrieval context; default off and not buyer Graph-RAG proof.
    /// </summary>
    public const string CommunitySummaryClaimBoundary =
        "Community summaries are optional when Retrieval:Advanced:EnableCommunitySummarization is true (default false); not buyer Graph-RAG proof.";

    public static HashSet<string> CollectAllowedEvidenceRefs(
        IReadOnlyList<Finding> engineFindings,
        GraphSnapshot graphSnapshot,
        IReadOnlyList<InsightGeneratorCommunitySummary>? communitySummaries = null)
    {
        ArgumentNullException.ThrowIfNull(engineFindings);
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        HashSet<string> allowedRefs = new(StringComparer.OrdinalIgnoreCase);

        foreach (Finding finding in engineFindings)
        {
            foreach (string reference in InsightDensityEngineFindingEvidenceSummary.CollectAllowedEvidenceRefs(finding))
            {
                allowedRefs.Add(reference);
            }

            ExplainabilityTrace? trace = finding.Trace;

            if (trace is null)
            {
                continue;
            }

            foreach (string note in trace.Notes)
            {
                if (!note.StartsWith("evidence:", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                string reference = note["evidence:".Length..].Trim();

                if (!string.IsNullOrWhiteSpace(reference))
                {
                    allowedRefs.Add(reference);
                }
            }
        }

        if (graphSnapshot.Nodes is not null && graphSnapshot.Nodes.Count > 0)
        {
            foreach (GraphNode node in graphSnapshot.Nodes)
            {
                if (string.IsNullOrWhiteSpace(node.NodeId))
                {
                    continue;
                }

                allowedRefs.Add($"graph-node:{node.NodeId.Trim()}");

                if (!string.IsNullOrWhiteSpace(node.Label))
                {
                    allowedRefs.Add(node.Label.Trim());
                }
            }
        }

        AppendCommunitySummariesToAllowList(allowedRefs, communitySummaries);

        return allowedRefs;
    }

    public static void AppendCommunitySummariesToAllowList(
        ISet<string> allowedRefs,
        IReadOnlyList<InsightGeneratorCommunitySummary>? communitySummaries)
    {
        ArgumentNullException.ThrowIfNull(allowedRefs);

        if (communitySummaries is null || communitySummaries.Count == 0)
            return;

        foreach (InsightGeneratorCommunitySummary summary in communitySummaries)
        {
            if (string.IsNullOrWhiteSpace(summary.CommunityId))
                continue;

            allowedRefs.Add(InsightGeneratorCommunityEvidenceRefs.Format(summary.CommunityId));
        }
    }

    public static string BuildUserPrompt(
        IReadOnlyList<Finding> engineFindings,
        GraphSnapshot graphSnapshot,
        IReadOnlySet<string> allowedEvidenceRefs,
        int maxFindings,
        IReadOnlyList<InsightGeneratorCommunitySummary>? communitySummaries = null)
    {
        ArgumentNullException.ThrowIfNull(engineFindings);
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        ArgumentNullException.ThrowIfNull(allowedEvidenceRefs);

        StringBuilder builder = new();
        builder.AppendLine("Propose up to ");
        builder.Append(maxFindings);
        builder.AppendLine(" NEW findings from the bounded evidence below.");
        builder.AppendLine();
        builder.AppendLine("Allowed evidenceRefs (copy ONLY from this list):");
        foreach (string reference in allowedEvidenceRefs.OrderBy(static value => value, StringComparer.OrdinalIgnoreCase))
        {
            builder.Append("  - ");
            builder.AppendLine(reference);
        }

        builder.AppendLine();
        AppendCommunitySummariesSection(builder, communitySummaries);
        builder.AppendLine("Graph labels (sample):");
        AppendGraphLabels(builder, graphSnapshot);
        builder.AppendLine();
        builder.AppendLine("Existing high-signal engine findings (sample):");
        AppendPreferredFindings(builder, engineFindings);

        return builder.ToString();
    }

    public static void AppendCommunitySummariesSection(
        StringBuilder builder,
        IReadOnlyList<InsightGeneratorCommunitySummary>? communitySummaries)
    {
        ArgumentNullException.ThrowIfNull(builder);

        if (communitySummaries is null || communitySummaries.Count == 0)
            return;

        builder.AppendLine(CommunitySummaryClaimBoundary);
        builder.AppendLine("Community summaries (optional — cite community:{id} refs only from this list):");

        foreach (InsightGeneratorCommunitySummary summary in communitySummaries)
        {
            builder.Append("  - ");
            builder.Append(InsightGeneratorCommunityEvidenceRefs.Format(summary.CommunityId));
            builder.Append(": ");
            builder.AppendLine(summary.Summary);
        }

        builder.AppendLine();
    }

    private static void AppendGraphLabels(StringBuilder builder, GraphSnapshot graphSnapshot)
    {
        if (graphSnapshot.Nodes is null || graphSnapshot.Nodes.Count == 0)
        {
            builder.AppendLine("  (none)");
            return;
        }

        IEnumerable<string> labels = graphSnapshot.Nodes
            .Where(static node => !string.IsNullOrWhiteSpace(node.Label))
            .Select(static node => node.Label.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(40);

        foreach (string label in labels)
        {
            builder.Append("  - ");
            builder.AppendLine(label);
        }
    }

    private static void AppendPreferredFindings(StringBuilder builder, IReadOnlyList<Finding> engineFindings)
    {
        IEnumerable<Finding> preferred = engineFindings
            .Where(finding => InsightDensityPreferredEngineTypes.IsPreferred(finding.EngineType))
            .Take(20);

        List<Finding> sample = preferred.ToList();

        if (sample.Count == 0)
        {
            sample = engineFindings.Take(10).ToList();
        }

        if (sample.Count == 0)
        {
            builder.AppendLine("  (none)");
            return;
        }

        foreach (Finding finding in sample)
        {
            builder.Append("  - [");
            builder.Append(finding.EngineType);
            builder.Append("] ");
            builder.Append(finding.Title);
            builder.Append(" — ");
            builder.AppendLine(finding.Rationale);
        }
    }
}
