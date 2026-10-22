using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Tests.GoldenCorpus;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Services;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeclarationSecurityBaselineFindingEngineTests
{
  private readonly DeclarationSecurityBaselineFindingEngine _sut =
      new(new FixedComplianceRulePackProvider(CreateFailOpenPolicyPack()));

  [Fact]
  public async Task AnalyzeAsync_emits_finding_for_unsafe_tf_property()
  {
    GraphSnapshot graph = new()
    {
      Nodes =
      [
        new GraphNode
        {
          NodeId = "obj-storage",
          NodeType = "TopologyResource",
          Label = "docs",
          Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
          {
            ["tf.public_network_access"] = "enabled",
          },
        },
      ],
    };

    IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

    findings.Should().ContainSingle();
    findings[0].EngineType.Should().Be("declaration-security-baseline");
    findings[0].Severity.Should().Be(FindingSeverity.Error);
    findings[0].EvidenceRefs.Should().BeEmpty();
  }

  [Fact]
  public async Task AnalyzeAsync_label_only_node_evidence_refs_stay_empty()
  {
    GraphSnapshot graph = new()
    {
      Nodes =
      [
        new GraphNode
        {
          NodeId = "obj-storage",
          NodeType = "TopologyResource",
          Label = "docs",
          Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
          {
            ["httpsOnly"] = "false",
          },
        },
      ],
    };

    IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

    Finding finding = findings.Should().ContainSingle().Subject;
    finding.EvidenceRefs.Should().BeEmpty();
    GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(finding.EvidenceRefs).Should().BeFalse();
  }

  [Fact]
  public async Task AnalyzeAsync_node_with_arm_resource_id_populates_evidence_refs()
  {
    const string armResourceId =
        "/subscriptions/33333333-3333-3333-3333-333333333333/resourceGroups/rg-decl/providers/Microsoft.Storage/storageAccounts/stpub";

    GraphSnapshot graph = new()
    {
      Nodes =
      [
        new GraphNode
        {
          NodeId = "obj-storage",
          NodeType = "TopologyResource",
          Label = "docs",
          Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
          {
            ["tf.public_network_access"] = "enabled",
            ["armResourceId"] = armResourceId,
          },
        },
      ],
    };

    IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

    Finding finding = findings.Should().ContainSingle().Subject;
    finding.EvidenceRefs.Should().ContainSingle().Which.Should().Be(armResourceId);
    GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(finding.EvidenceRefs).Should().BeTrue();

    InsightDensityGateCandidate candidate = InsightDensityGateCandidate.FromFinding(finding);
    DeterministicInsightDensityGate gate = (DeterministicInsightDensityGate)DeterministicInsightDensityGate.CreateDefault();
    InsightDensityGateResult result = gate.Score(candidate, [candidate]);

    result.PenaltyReasons.Should().NotContain("no-concrete-evidence");
  }

  private static ComplianceRulePack CreateFailOpenPolicyPack() =>
      new()
      {
          RulePackId = "test-pack",
          Name = "Test",
          Version = "1",
          Rules =
          [
              new ComplianceRule
              {
                  RuleId = "cost-opt-001",
                  ControlId = "c",
                  ControlName = "n",
                  AppliesToCategory = "cat",
                  RequiredNodeType = "t",
                  RequiredEdgeType = "e",
                  Description = "d",
              },
          ],
      };
}
