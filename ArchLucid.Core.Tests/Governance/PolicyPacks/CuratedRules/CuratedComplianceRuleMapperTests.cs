using ArchLucid.Contracts.Compliance;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks.CuratedRules;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Governance.PolicyPacks.CuratedRules;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CuratedComplianceRuleMapperTests
{
    [Fact]
    public void TryMapToComplianceRule_NullEntry_Throws()
    {
        Action act = () => CuratedComplianceRuleMapper.TryMapToComplianceRule(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("entry");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void TryMapToComplianceRule_BlankId_ReturnsNull(string? id)
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = id,
        };

        CuratedComplianceRuleMapper.TryMapToComplianceRule(entry).Should().BeNull();
    }

    [Fact]
    public void TryMapToComplianceRule_MinimalEntry_AppliesDefaultsAndTrimsId()
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "  tenant-rule-1  ",
        };

        ComplianceRule? rule = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        rule.Should().NotBeNull();
        rule!.RuleId.Should().Be("tenant-rule-1");
        rule.ControlId.Should().Be("tenant-rule-1");

        // Title is absent, so the mapper falls back to the trimmed rule id.
        rule.ControlName.Should().Be("tenant-rule-1");
        rule.AppliesToCategory.Should().Be(CuratedComplianceRuleMapper.TenantCuratedCategory);
        rule.RequiredNodeType.Should().BeEmpty();
        rule.RequiredEdgeType.Should().BeEmpty();
        rule.Severity.Should().Be("Medium");
        rule.Priority.Should().Be(PolicyPackRulePriority.Default);
        rule.Description.Should().BeEmpty();
    }

    [Fact]
    public void TryMapToComplianceRule_TitleAndSeverityProvided_AreTrimmed()
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "tenant-rule-2",
            Title = "  Encrypt data at rest  ",
            Severity = "  High  ",
        };

        ComplianceRule? rule = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        rule.Should().NotBeNull();
        rule!.ControlName.Should().Be("Encrypt data at rest");
        rule.Severity.Should().Be("High");
    }

    [Theory]
    [InlineData("P0", PolicyPackRulePriority.P0)]
    [InlineData("  p0  ", PolicyPackRulePriority.P0)]
    [InlineData("0", PolicyPackRulePriority.P0)]
    [InlineData("P2", PolicyPackRulePriority.P2)]
    [InlineData("2", PolicyPackRulePriority.P2)]
    [InlineData("P1", PolicyPackRulePriority.P1)]
    [InlineData("not-a-tier", PolicyPackRulePriority.P1)]
    public void TryMapToComplianceRule_ExplicitPriority_IsNormalizedToTier(string priority, string expected)
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "tenant-rule-3",
            Priority = priority,
        };

        ComplianceRule? rule = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        rule.Should().NotBeNull();
        rule!.Priority.Should().Be(expected);
    }

    [Fact]
    public void TryMapToComplianceRule_EmptyCollections_OmitDescriptionSections()
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "tenant-rule-4",
            Description = "Base only.",
            EvidenceHints = [],
            FrameworkMappings = [],
        };

        ComplianceRule? rule = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        rule.Should().NotBeNull();
        rule!.Description.Should().Be("Base only.");
    }

    [Fact]
    public void TryMapToComplianceRule_AllHintsAndMappingsBlank_EmitsHeadersWithoutItems()
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "tenant-rule-5",
            EvidenceHints = ["", "   "],
            FrameworkMappings =
            [
                null!,
                new CuratedRulesFrameworkMappingEntry
                {
                    Framework = "   ",
                },
            ],
        };

        ComplianceRule? rule = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        rule.Should().NotBeNull();

        // Headers are emitted from the non-empty list check; every item is then filtered out.
        rule!.Description.Should().Be("\n\nEvidence hints:\n\nFramework mappings:");
    }

    [Fact]
    public void TryMapToComplianceRule_FullEntry_ComposesDescriptionSections()
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "tenant-rule-6",
            Title = "Rotate keys",
            Description = "  Keys must rotate every 90 days.  ",
            RemediationGuidance = "  Enable automatic rotation.  ",
            EvidenceHints = ["  Key Vault rotation policy  ", "", "Audit log export"],
            FrameworkMappings =
            [
                null!,
                new CuratedRulesFrameworkMappingEntry
                {
                    Framework = "  ",
                    Control = "ignored",
                },
                new CuratedRulesFrameworkMappingEntry
                {
                    Framework = "  SOC 2  ",
                },
                new CuratedRulesFrameworkMappingEntry
                {
                    Framework = "ISO 27001",
                    Control = "  A.10.1  ",
                },
                new CuratedRulesFrameworkMappingEntry
                {
                    Framework = "PCI DSS",
                    Requirement = "  3.6.4  ",
                },
                new CuratedRulesFrameworkMappingEntry
                {
                    Framework = "NIST 800-53",
                    Control = "SC-12",
                    Requirement = "Key management",
                },
            ],
        };

        ComplianceRule? rule = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        rule.Should().NotBeNull();
        rule!.Description.Should().Be(
            "Keys must rotate every 90 days."
            + "\n\nRemediation: Enable automatic rotation."
            + "\n\nEvidence hints:"
            + "\n- Key Vault rotation policy"
            + "\n- Audit log export"
            + "\n\nFramework mappings:"
            + "\n- SOC 2"
            + "\n- ISO 27001 — control: A.10.1"
            + "\n- PCI DSS — requirement: 3.6.4"
            + "\n- NIST 800-53 — control: SC-12 — requirement: Key management");
    }
}
