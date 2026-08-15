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

    [Fact]
    public void GetViolations_allows_azure_inventory_security_baseline_with_rules_and_requirement_payload()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "azure-baseline-1",
                    FindingType = "AzureInventorySecurityBaseline",
                    EngineType = "azure-inventory-security-baseline",
                    Category = "Security",
                    Payload = new RequirementFindingPayload
                    {
                        RequirementName =
                            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.storage/storageaccounts/sa1",
                        RequirementText = "Storage account allows blob public access.",
                    },
                    Trace = new ExplainabilityTrace
                    {
                        RulesApplied = ["azure-inventory-security-baseline-classifier"],
                    },
                },
            ],
        };

        DecisionGradeFindingProvenanceValidator.GetViolations(snapshot).Should().BeEmpty();
    }

    [Fact]
    public void GetViolations_allows_security_coverage_with_rules_graph_nodes_and_payload()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "security-1",
                    FindingType = "SecurityCoverageFinding",
                    EngineType = "security-coverage",
                    Category = "Security",
                    Payload = new SecurityCoverageFindingPayload
                    {
                        SecurityNodeCount = 2,
                        ProtectedResourceCount = 1,
                        UnprotectedResourceCount = 2,
                        UnprotectedResources = ["res-a", "res-b"],
                    },
                    Trace = new ExplainabilityTrace
                    {
                        GraphNodeIdsExamined = ["res-a", "res-b"],
                        RulesApplied = ["security-coverage-protection"],
                    },
                },
            ],
        };

        DecisionGradeFindingProvenanceValidator.GetViolations(snapshot).Should().BeEmpty();
    }

    [Fact]
    public void GetViolations_allows_policy_coverage_with_rules_graph_nodes_and_payload()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "policy-1",
                    FindingType = "PolicyCoverageFinding",
                    EngineType = "policy-coverage",
                    Category = "Policy",
                    Payload = new PolicyCoverageFindingPayload
                    {
                        PolicyNodeCount = 1,
                        PolicyApplicabilityEdgeCount = 0,
                        UncoveredResources = ["storage-1", "vm-2"],
                    },
                    Trace = new ExplainabilityTrace
                    {
                        GraphNodeIdsExamined = ["storage-1", "vm-2"],
                        RulesApplied = ["policy-coverage-applicability"],
                    },
                },
            ],
        };

        DecisionGradeFindingProvenanceValidator.GetViolations(snapshot).Should().BeEmpty();
    }

    [Fact]
    public void GetViolations_allows_topology_coverage_presence_with_rules_and_payload()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "topology-1",
                    FindingType = "TopologyCoverageFinding",
                    EngineType = "topology-coverage",
                    Category = "Topology",
                    Payload = new TopologyCoverageFindingPayload
                    {
                        TopologyNodeCount = 0,
                        ExpectedCategories = ["network", "storage"],
                        MissingCategories = ["network", "storage"],
                    },
                    Trace = new ExplainabilityTrace { RulesApplied = ["topology-coverage-presence"] },
                },
            ],
        };

        DecisionGradeFindingProvenanceValidator.GetViolations(snapshot).Should().BeEmpty();
    }

    [Fact]
    public void GetViolations_allows_advisor_cost_recommendation_with_rules_and_payload()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "advisor-1",
                    FindingType = "AdvisorCostRecommendation",
                    EngineType = "advisor-cost-recommendation",
                    Category = "CostOptimization",
                    Payload = new AdvisorCostRecommendationFindingPayload
                    {
                        RecommendationId = "rec-1",
                        Title = "Right-size underutilized VM",
                        Category = "Cost",
                        EntryIndex = 0,
                    },
                    Trace = new ExplainabilityTrace { RulesApplied = ["extractor-advisor-cost-json"] },
                },
            ],
        };

        DecisionGradeFindingProvenanceValidator.GetViolations(snapshot).Should().BeEmpty();
    }
}
