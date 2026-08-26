using ArchLucid.Contracts.Findings;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>
///     Reads stamped cost expectation keys from the context snapshot node.
/// </summary>
public static class PolicyExpectationCostGraphReader
{
  public static bool RequiresBudgetCap(GraphSnapshot graphSnapshot)
  {
    ArgumentNullException.ThrowIfNull(graphSnapshot);

    GraphNode? contextNode = FindContextNode(graphSnapshot);

    if (contextNode is null)
      return false;

    if (!contextNode.Properties.TryGetValue(ContextGraphPropertyKeys.PolicyCostRequireBudgetCap, out string? raw))
      return false;

    return raw.Equals("true", StringComparison.OrdinalIgnoreCase);
  }

  public static FindingSeverity? ResolveBreachSeverityOverride(GraphSnapshot graphSnapshot)
  {
    ArgumentNullException.ThrowIfNull(graphSnapshot);

    GraphNode? contextNode = FindContextNode(graphSnapshot);

    if (contextNode is null)
      return null;

    if (!contextNode.Properties.TryGetValue(ContextGraphPropertyKeys.PolicyCostBreachSeverity, out string? raw)
        || string.IsNullOrWhiteSpace(raw))
    {
      return null;
    }

    if (!Enum.TryParse<FindingSeverity>(raw.Trim(), ignoreCase: true, out FindingSeverity severity))
      return null;

    // Packs may raise severity but not hide breaches below Warning.
    if (severity < FindingSeverity.Warning)
      return FindingSeverity.Warning;

    return severity;
  }

  public static bool GraphHasWorkloadTopology(GraphSnapshot graphSnapshot)
  {
    ArgumentNullException.ThrowIfNull(graphSnapshot);

    return graphSnapshot.Nodes.Exists(n =>
        string.Equals(n.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase));
  }

  public static bool GraphHasParseableBudgetCap(GraphSnapshot graphSnapshot)
  {
    ArgumentNullException.ThrowIfNull(graphSnapshot);

    foreach (GraphNode node in graphSnapshot.Nodes)
    {
      if (!string.Equals(node.NodeType, "CostConstraint", StringComparison.OrdinalIgnoreCase))
        continue;

      if (node.Properties.TryGetValue("maxMonthlyCost", out string? maxCostRaw)
          && decimal.TryParse(maxCostRaw, out _))
      {
        return true;
      }
    }

    return false;
  }

  private static GraphNode? FindContextNode(GraphSnapshot graphSnapshot) =>
      graphSnapshot.Nodes.FirstOrDefault(n =>
          string.Equals(n.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase));
}
