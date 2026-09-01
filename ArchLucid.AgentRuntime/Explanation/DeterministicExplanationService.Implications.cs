using ArchLucid.Core.Explanation;
using ArchLucid.Provenance;

namespace ArchLucid.AgentRuntime.Explanation;

public sealed partial class DeterministicExplanationService
{
    /// <inheritdoc />
    public List<string> ExtractRunKeyDrivers(ManifestDocument m, DecisionProvenanceGraph? g)
    {
        List<string> list = m.Decisions.Take(25).Select(d => $"{d.Category}: {d.Title} → {d.SelectedOption}").ToList();

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
        List<string> list = m.UnresolvedIssues.Items.Take(20).Select(i => $"[{i.Severity}] {i.Title}: {i.Description}")
            .ToList();
        list.AddRange(m.Warnings.Take(10).Select(w => $"Warning: {w}"));

        if (list.Count == 0)
            list.Add("No unresolved issues recorded.");

        return list;
    }

    /// <inheritdoc />
    public List<string> ExtractCostImplications(ManifestDocument m)
    {
        List<string> list =
        [
            m.Cost.MaxMonthlyCost.HasValue
                ? $"Max monthly cost: {m.Cost.MaxMonthlyCost.Value:0.00}"
                : "Max monthly cost not specified."
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
            list.Add("No compliance gaps listed.");

        return list;
    }

    /// <inheritdoc />
    public string FormatProvenanceSummary(DecisionProvenanceGraph? g)
    {
        return g is null
            ? "No provenance graph supplied."
            : $"Nodes: {g.Nodes.Count}, Edges: {g.Edges.Count}. RunId on graph: {g.RunId}.";
    }
}
