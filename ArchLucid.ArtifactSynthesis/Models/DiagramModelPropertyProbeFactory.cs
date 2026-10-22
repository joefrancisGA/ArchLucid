using System.Collections;
using System.Reflection;

using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.ArtifactSynthesis.Models;

/// <summary>
///     Builds diagram models with every scalar/list property set to a distinctive non-default value for copy coverage tests.
/// </summary>
internal static class DiagramModelPropertyProbeFactory
{
    private static readonly Guid ProbeGuid = Guid.Parse("11111111-2222-3333-4444-555555555555");

    internal static DiagramNode CreatePopulatedDiagramNode()
    {
        DiagramNode node = new()
        {
            NodeId = "probe_node_alpha",
            Label = "Probe label value",
            NodeType = "TopologyResource",
            SubgraphId = "probe_subgraph_alpha",
            OrderKey = 17,
            CloudResourceId = ProbeGuid,
            ArmResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/probe",
            SeedNodeId = "seed-probe-alpha",
            ArmResourceType = "Microsoft.Storage/storageAccounts",
            ArmResourceKind = "Storage",
            ExternalLinkedServiceType = "AzureBlobStorage",
            ExternalFactoryName = "factory-probe",
            ExternalFactoryNames = ["factory-a", "factory-b"],
            ExternalTargetHost = "probe.example.com",
            ExternalTargetHosts = ["host-a.example.com", "host-b.example.com"],
            ExternalIntegrationRuntime = "ir-probe",
            ExternalIntegrationRuntimes = ["ir-a", "ir-b"],
            ExternalHostInKeyVault = true,
            IsDataFlowRollup = true,
            IsCollapsedResourceGroupTail = true,
            CollapsedResourceGroupTailMemberNames = ["rg-tail-a", "rg-tail-b"],
            DataFlowRollupOrdinal = 3,
            DataFlowRollupMemberIds = ["member-a", "member-b"],
            DataFlowRollupMemberNames = ["name-a", "name-b"],
            DataFlowRollupStatusLine = "rollup status probe",
            ArmResourceGroup = "rg-probe",
            IncludeResourceGroupInCaption = true,
            HasPrivateEndpointAccess = true,
            HasPublicInternetExposure = true,
            IsExecutiveOverflow = true,
            IsUnresolvedPolicyOutlineOnly = true,
            ParentAttachmentDetails = ["parent-detail-a"],
            ConnectionState = InventoryDiagramConnectionState.Orphaned,
            ConnectionStateMessage = "connection probe",
            QuestionableAttention = new DiagramQuestionableAttention("probe reason", "probe action"),
            UnresolvedRelationshipDetails = ["unresolved-a"],
            IsAvdCollapsedBoundary = true,
            DataFlowTraversalHopEvidenceDetails = ["hop-evidence-a"],
            NsgInboundRuleChips = [new DiagramNsgInboundRuleChip("443/tcp", true)],
        };

        return node;
    }

    internal static DiagramEdge CreatePopulatedDiagramEdge()
    {
        return new DiagramEdge
        {
            FromNodeId = "probe_node_alpha",
            ToNodeId = "probe_node_beta",
            Label = "probe edge label",
            IsLayoutOnly = true,
            ProvenanceKind = "ObservedFact",
            InferenceSource = "inventory.probe",
            DeclaredConnectionId = "conn-probe",
            IsDataFlowNsgBlocked = true,
            DataFlowNsgAnnotationLabels = ["TCP/443"],
            DataFlowNsgSupportingRuleDetails = ["rule-probe"],
        };
    }

    internal static DiagramSubgraph CreatePopulatedDiagramSubgraph()
    {
        return new DiagramSubgraph
        {
            SubgraphId = "probe_subgraph_alpha",
            Label = "Probe subgraph label",
            ParentSubgraphId = "probe_parent_subgraph",
            OrderKey = 9,
        };
    }

    internal static DiagramAst CreatePopulatedDiagramAst()
    {
        DiagramNode node = CreatePopulatedDiagramNode();
        DiagramEdge edge = CreatePopulatedDiagramEdge();
        DiagramSubgraph subgraph = CreatePopulatedDiagramSubgraph();

        return new DiagramAst
        {
            Title = "Probe diagram title",
            Nodes = [node],
            Edges = [edge],
            Subgraphs = [subgraph],
            FlowchartDirection = "LR",
            CaptionLines = ["caption-probe-a"],
            DropGateRows =
            [
                new DiagramDropGateRow
                {
                    FromNodeId = "probe_node_alpha",
                    ToNodeId = "probe_node_beta",
                    Reason = "drop-reason-probe",
                },
            ],
            LedgerDrops =
            [
                new DiagramMermaidLedgerDrop
                {
                    FromNodeId = "probe_node_alpha",
                    ToNodeId = "probe_node_beta",
                    Reason = "ledger-reason-probe",
                },
            ],
        };
    }

    internal static IReadOnlyList<string> GetMismatchedPropertyNames<T>(
        T expected,
        T actual,
        IReadOnlySet<string> exemptPropertyNames)
    {
        ArgumentNullException.ThrowIfNull(expected);
        ArgumentNullException.ThrowIfNull(actual);
        ArgumentNullException.ThrowIfNull(exemptPropertyNames);

        List<string> mismatches = [];

        foreach (PropertyInfo property in typeof(T).GetProperties(BindingFlags.Instance | BindingFlags.Public))
        {
            if (!property.CanRead || exemptPropertyNames.Contains(property.Name))
                continue;

            object? expectedValue = property.GetValue(expected);
            object? actualValue = property.GetValue(actual);

            if (!ValuesEqual(expectedValue, actualValue))
                mismatches.Add(property.Name);
        }

        return mismatches;
    }

    private static bool ValuesEqual(object? expected, object? actual)
    {
        if (expected is null && actual is null)
            return true;

        if (expected is null || actual is null)
            return false;

        if (expected is IEnumerable expectedEnumerable && expected is not string)
        {
            if (actual is not IEnumerable actualEnumerable || actual is string)
                return false;

            List<object?> expectedItems = expectedEnumerable.Cast<object?>().ToList();
            List<object?> actualItems = actualEnumerable.Cast<object?>().ToList();

            if (expectedItems.Count != actualItems.Count)
                return false;

            for (int index = 0; index < expectedItems.Count; index++)
            {
                if (!ValuesEqual(expectedItems[index], actualItems[index]))
                    return false;
            }

            return true;
        }

        if (expected.GetType().IsClass)
        {
            if (actual is null || actual.GetType() != expected.GetType())
                return false;

            return GetMismatchedPropertyNames(expected, actual, new HashSet<string>(StringComparer.Ordinal)).Count == 0;
        }

        return Equals(expected, actual);
    }
}
