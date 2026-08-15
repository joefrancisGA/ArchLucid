using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class DecisionGradeFindingProvenanceValidatorTests
{
    [Fact]
    public void GetViolations_exempts_checklist_coverage()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "check-1",
                    FindingType = "Hygiene",
                    Category = "Checklist",
                    Classification = FindingClassification.ChecklistCoverage,
                },
            ],
        };

        DecisionGradeFindingProvenanceValidator.GetViolations(snapshot).Should().BeEmpty();
    }

    [Fact]
    public void GetViolations_requires_agent_citations()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "agent-1",
                    FindingType = "AgentArchitectureFinding-Compliance",
                    Category = "Compliance",
                    Trace = new ExplainabilityTrace(),
                },
            ],
        };

        DecisionGradeFindingProvenanceValidator.GetViolations(snapshot)
            .Should().ContainSingle(v => v.Contains("agent-1"));
    }

    [Fact]
    public void GetViolations_allows_typed_engine_with_nodes_and_rules()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "engine-1",
                    FindingType = "TopologyGap",
                    Category = "Topology",
                    RelatedNodeIds = ["node-1"],
                    Trace = new ExplainabilityTrace { RulesApplied = ["topology-gap-rule"] },
                },
            ],
        };

        DecisionGradeFindingProvenanceValidator.GetViolations(snapshot).Should().BeEmpty();
    }

    [Fact]
    public void GetViolations_allows_inventory_only_reconciliation_with_rules_and_payload_ids()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "inv-1",
                    FindingType = "InventoryReconciliationFinding",
                    EngineType = "azure-inventory-reconciliation",
                    Category = "Correctness",
                    Payload = new InventoryReconciliationFindingPayload
                    {
                        InventoryOnlyResourceIds =
                        [
                            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.compute/virtualmachines/vm1"
                        ]
                    },
                    Trace = new ExplainabilityTrace { RulesApplied = ["graph-azure-inventory-reconciliation"] },
                },
            ],
        };

        DecisionGradeFindingProvenanceValidator.GetViolations(snapshot).Should().BeEmpty();
    }

    [Fact]
    public void GetViolations_allows_orphan_resource_with_rules_and_requirement_payload()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "orphan-1",
                    FindingType = "OrphanedAzureResource",
                    EngineType = "orphaned-azure-resource",
                    Category = "CostOptimization",
                    Payload = new RequirementFindingPayload
                    {
                        RequirementName =
                            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.compute/disks/disk1",
                        RequirementText = "Unattached disk",
                    },
                    Trace = new ExplainabilityTrace { RulesApplied = ["orphaned-azure-resource-classifier"] },
                },
            ],
        };

        DecisionGradeFindingProvenanceValidator.GetViolations(snapshot).Should().BeEmpty();
    }
}
