using System.Text.Json;

using ArchLucid.Core.Governance.PolicyPacks.CuratedRules;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Governance.PolicyPacks.CuratedRules;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CuratedPolicyPackRulesDocumentTests
{
    [Fact]
    public void CuratedPolicyPackRulesDocument_DeserializesPackAndRuleProperties()
    {
        const string json = """
            {
              "schemaVersion": 3,
              "kind": "curated-policy-pack-rules",
              "pack": {
                "name": "Curated Baseline",
                "description": "Baseline security controls",
                "version": "2.1.0",
                "category": "Security",
                "isDefault": true,
                "suggestedPackType": "Compliance",
                "policyPackContentDocumentPath": "packs/baseline.content.json"
              },
              "rules": [
                {
                  "id": "curated-1",
                  "title": "Private endpoints only",
                  "description": "Public network access must be disabled.",
                  "severity": "High",
                  "priority": "P0",
                  "remediationGuidance": "Disable public network access.",
                  "evidenceHints": ["Network rule set", "Firewall config"],
                  "frameworkMappings": [
                    {
                      "framework": "SOC 2",
                      "control": "CC6.6",
                      "requirement": "Restrict network access"
                    }
                  ]
                }
              ]
            }
            """;

        CuratedPolicyPackRulesDocument? document =
            JsonSerializer.Deserialize<CuratedPolicyPackRulesDocument>(json);

        document.Should().NotBeNull();
        document!.SchemaVersion.Should().Be(3);
        document.Kind.Should().Be("curated-policy-pack-rules");

        document.Pack.Should().NotBeNull();
        document.Pack!.Name.Should().Be("Curated Baseline");
        document.Pack.Description.Should().Be("Baseline security controls");
        document.Pack.Version.Should().Be("2.1.0");
        document.Pack.Category.Should().Be("Security");
        document.Pack.IsDefault.Should().BeTrue();
        document.Pack.SuggestedPackType.Should().Be("Compliance");
        document.Pack.PolicyPackContentDocumentPath.Should().Be("packs/baseline.content.json");

        document.Rules.Should().HaveCount(1);

        CuratedRulesRuleEntry ruleEntry = document.Rules![0];
        ruleEntry.Id.Should().Be("curated-1");
        ruleEntry.Title.Should().Be("Private endpoints only");
        ruleEntry.Description.Should().Be("Public network access must be disabled.");
        ruleEntry.Severity.Should().Be("High");
        ruleEntry.Priority.Should().Be("P0");
        ruleEntry.RemediationGuidance.Should().Be("Disable public network access.");
        ruleEntry.EvidenceHints.Should().Equal("Network rule set", "Firewall config");

        ruleEntry.FrameworkMappings.Should().HaveCount(1);
        ruleEntry.FrameworkMappings![0].Framework.Should().Be("SOC 2");
        ruleEntry.FrameworkMappings[0].Control.Should().Be("CC6.6");
        ruleEntry.FrameworkMappings[0].Requirement.Should().Be("Restrict network access");
    }

    [Fact]
    public void CuratedPolicyPackRulesDocument_AbsentSections_StayNull()
    {
        const string json = """{ "schemaVersion": 1 }""";

        CuratedPolicyPackRulesDocument? document =
            JsonSerializer.Deserialize<CuratedPolicyPackRulesDocument>(json);

        document.Should().NotBeNull();
        document!.SchemaVersion.Should().Be(1);
        document.Kind.Should().BeNull();
        document.Pack.Should().BeNull();
        document.Rules.Should().BeNull();
    }
}
