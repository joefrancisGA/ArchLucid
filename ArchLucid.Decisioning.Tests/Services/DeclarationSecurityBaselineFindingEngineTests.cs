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

    IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, CancellationToken.None);

    findings.Should().ContainSingle();
    findings[0].EngineType.Should().Be("declaration-security-baseline");
    findings[0].Severity.Should().Be(FindingSeverity.Error);
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
