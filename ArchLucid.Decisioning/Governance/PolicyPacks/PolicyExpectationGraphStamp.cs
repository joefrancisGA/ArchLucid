using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>
///     Writes parsed policy expectation extras onto the <see cref="GraphNodeTypes.ContextSnapshot" /> node.
/// </summary>
public static class PolicyExpectationGraphStamp
{
  public static void Stamp(GraphSnapshot graph, PolicyPackExpectationFacet facet)
  {
    ArgumentNullException.ThrowIfNull(graph);
    ArgumentNullException.ThrowIfNull(facet);

    if (facet.IsEmpty)
      return;

    GraphNode? contextNode = graph.Nodes.FirstOrDefault(n =>
        string.Equals(n.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase));

    if (contextNode is null)
      return;

    if (facet.ExtraTopologyCategories.Count > 0)
    {
      contextNode.Properties[ContextGraphPropertyKeys.PolicyExpectedTopologyCategories] =
          string.Join('|', facet.ExtraTopologyCategories);
    }

    if (facet.ExtraSecurityControlFamilies.Count > 0)
    {
      contextNode.Properties[ContextGraphPropertyKeys.PolicyExpectedSecurityControlFamilies] =
          string.Join('|', facet.ExtraSecurityControlFamilies);
    }

    if (facet.ExtraRequirementThemes.Count > 0)
    {
      contextNode.Properties[ContextGraphPropertyKeys.PolicyExpectedRequirementThemes] =
          string.Join('|', facet.ExtraRequirementThemes);
    }

    if (facet.RequireBudgetCap == true)
    {
      contextNode.Properties[ContextGraphPropertyKeys.PolicyCostRequireBudgetCap] = "true";
    }

    if (!string.IsNullOrWhiteSpace(facet.BreachSeverity))
    {
      contextNode.Properties[ContextGraphPropertyKeys.PolicyCostBreachSeverity] = facet.BreachSeverity.Trim();
    }
  }
}
