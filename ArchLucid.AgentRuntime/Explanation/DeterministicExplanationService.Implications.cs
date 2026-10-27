using ArchLucid.Core.Explanation;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Provenance;

namespace ArchLucid.AgentRuntime.Explanation;

public sealed partial class DeterministicExplanationService
{
    /// <inheritdoc />
    public List<string> ExtractRunKeyDrivers(ManifestDocument m, DecisionProvenanceGraph? g)
    {
        List<string> list = m.Decisions.Take(25).Select(FormatRunKeyDriverLine).ToList();

        if (m.Topology.Resources.Count > 0)
            list.Add($"{m.Topology.Resources.Count} topology resource(s) recorded.");

        if (m.Compliance.Gaps.Count > 0)
            list.Add($"{m.Compliance.Gaps.Count} compliance gap(s).");

        if (g is null)
            return list;

        Dictionary<ProvenanceNodeType, int> byType =
            g.Nodes.GroupBy(n => n.Type).ToDictionary(x => x.Key, x => x.Count());
        list.Add(
            $"Provenance graph: {g.Nodes.Count} node(s), {g.Edges.Count} edge(s); " +
            string.Join(", ", byType.Select(kv => $"{kv.Key}={kv.Value}")));

        return list;
    }

    /// <inheritdoc />
    public List<string> ExtractRiskImplications(ManifestDocument m)
    {
        List<string> list = m.UnresolvedIssues.Items.Take(20).Select(FormatUnresolvedIssueLine).ToList();
        list.AddRange(m.Warnings.Take(10).Select(w => $"Warning: {w}"));

        if (list.Count == 0)
            list.Add("No unresolved issues were listed on the manifest.");

        return list;
    }

    /// <inheritdoc />
    public List<string> ExtractCostImplications(ManifestDocument m)
    {
        List<string> list =
        [
            m.Cost.MaxMonthlyCost.HasValue
                ? $"Max monthly cost: {m.Cost.MaxMonthlyCost.Value:0.00}"
                : "Max monthly cost was not stored on the manifest."
        ];

        list.AddRange(m.Cost.CostRisks.Take(10).Select(r => $"Cost risk: {r}"));

        return list;
    }

    /// <inheritdoc />
    public List<string> ExtractComplianceImplications(ManifestDocument m)
    {
        List<string> list = m.Compliance.Gaps.Take(15).Select(g => $"Compliance gap: {g}").ToList();

        if (m.Compliance.Controls.Count > 0)
            list.Insert(0, $"{m.Compliance.Controls.Count} compliance control(s) evaluated.");

        if (list.Count == 0)
            list.Add("No compliance gaps were listed on the manifest.");

        return list;
    }

    /// <inheritdoc />
    public string FormatProvenanceSummary(DecisionProvenanceGraph? g)
    {
        return g is null
            ? "Provenance graph was not supplied for this run."
            : $"Nodes: {g.Nodes.Count}, Edges: {g.Edges.Count}. RunId on graph: {g.RunId}.";
    }

    private static string FormatRunKeyDriverLine(ResolvedArchitectureDecision decision)
    {
        string category = string.IsNullOrWhiteSpace(decision.Category)
            ? "Decision category was not stored."
            : decision.Category.Trim();
        string title = string.IsNullOrWhiteSpace(decision.Title)
            ? "Decision title was not stored."
            : decision.Title.Trim();
        string option = string.IsNullOrWhiteSpace(decision.SelectedOption)
            ? "Selected option was not stored."
            : decision.SelectedOption.Trim();

        return $"{category}: {title} → {option}";
    }

    private static string FormatUnresolvedIssueLine(ManifestIssue issue)
    {
        string severity = string.IsNullOrWhiteSpace(issue.Severity)
            ? "Severity was not stored"
            : issue.Severity.Trim();
        string title = string.IsNullOrWhiteSpace(issue.Title)
            ? "Issue title was not stored."
            : issue.Title.Trim();
        string description = string.IsNullOrWhiteSpace(issue.Description)
            ? "Issue description was not stored."
            : issue.Description.Trim();

        return $"[{severity}] {title}: {description}";
    }
}
