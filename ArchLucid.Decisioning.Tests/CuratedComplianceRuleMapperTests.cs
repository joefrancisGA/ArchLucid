using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks.CuratedRules;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class CuratedComplianceRuleMapperTests
{
    [Fact]
    public void TryMapToComplianceRule_WhenIdMissing_ReturnsNull()
    {
        CuratedRulesRuleEntry entry = new() { Title = "x" };

        ComplianceRule? mapped = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        mapped.Should().BeNull();
    }

    [Fact]
    public void TryMapToComplianceRule_MapsCoreFieldsAndDefaults()
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "tenant-001",
            Title = "Control title",
            Description = "Body",
            Severity = "Critical",
        };

        ComplianceRule? mapped = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        mapped.Should().NotBeNull();
        mapped!.RuleId.Should().Be("tenant-001");
        mapped.ControlId.Should().Be("tenant-001");
        mapped.ControlName.Should().Be("Control title");
        mapped.Description.Should().Be("Body");
        mapped.Severity.Should().Be("Critical");
        mapped.AppliesToCategory.Should().Be(CuratedComplianceRuleMapper.TenantCuratedCategory);
        mapped.Priority.Should().Be(PolicyPackRulePriority.P1);
        mapped.RequiredNodeType.Should().BeEmpty();
        mapped.RequiredEdgeType.Should().BeEmpty();
    }

    [Fact]
    public void TryMapToComplianceRule_MapsExplicitPriority()
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "tenant-p0",
            Title = "t",
            Severity = "High",
            Priority = "P0",
        };

        ComplianceRule? mapped = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        mapped!.Priority.Should().Be(PolicyPackRulePriority.P0);
    }

    [Fact]
    public void TryMapToComplianceRule_AppendsExtendedFieldsToDescription()
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "r1",
            Title = "t",
            Description = "Base",
            Severity = "High",
            RemediationGuidance = "Fix it",
            EvidenceHints = ["hint-a", "hint-b"],
            FrameworkMappings =
            [
                new CuratedRulesFrameworkMappingEntry { Framework = "SOC2", Control = "CC6" },
                new CuratedRulesFrameworkMappingEntry { Framework = "ISO", Requirement = "A.8" },
            ],
        };

        ComplianceRule? mapped = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        mapped.Should().NotBeNull();
        mapped!.Description.Should().Contain("Base");
        mapped.Description.Should().Contain("Remediation: Fix it");
        mapped.Description.Should().Contain("Evidence hints:");
        mapped.Description.Should().Contain("- hint-a");
        mapped.Description.Should().Contain("Framework mappings:");
        mapped.Description.Should().Contain("SOC2");
        mapped.Description.Should().Contain("CC6");
        mapped.Description.Should().Contain("ISO");
        mapped.Description.Should().Contain("A.8");
    }
}
