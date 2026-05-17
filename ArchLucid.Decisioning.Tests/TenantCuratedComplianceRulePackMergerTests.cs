using System.Text.Json;

using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks.CuratedRules;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class TenantCuratedComplianceRulePackMergerTests
{
    private static ComplianceRulePack Pack(params ComplianceRule[] rules) =>
        new()
        {
            RulePackId = "file",
            Name = "File",
            Version = "1",
            RulePackHash = "h",
            SourcePath = "p",
            Rules = rules.ToList(),
        };

    private static ComplianceRule FileRule(string id, string controlName = "n") =>
        new()
        {
            RuleId = id,
            ControlId = "c",
            ControlName = controlName,
            AppliesToCategory = "cat",
            RequiredNodeType = "nt",
            RequiredEdgeType = "et",
            Description = "d",
            Severity = "Warning",
        };

    private static string CuratedJson(params (string id, string title)[] rules)
    {
        var doc = new
        {
            schemaVersion = 1,
            kind = "archlucid.policyPack.curatedRules.v1",
            pack = new { name = "Test", version = "1.0.0" },
            rules = rules
                .Select(r => new
                {
                    id = r.id,
                    title = r.title,
                    description = "Curated description",
                    severity = "High",
                })
                .ToList(),
        };

        return JsonSerializer.Serialize(doc, PolicyPackJsonSerializerOptions.Default);
    }

    [Fact]
    public void Merge_WhenMetadataMissing_ReturnsSameInstance()
    {
        ComplianceRulePack file = Pack(FileRule("a"));
        PolicyPackContentDocument effective = new();

        ComplianceRulePack merged = TenantCuratedComplianceRulePackMerger.MergeFilePackWithCuratedFromGovernance(file, effective);

        merged.Should().BeSameAs(file);
    }

    [Fact]
    public void Merge_AppendsCuratedOnlyRules_AfterFileRules_PreservingFileOrder()
    {
        ComplianceRulePack file = Pack(FileRule("x"), FileRule("y"));
        PolicyPackContentDocument effective = new()
        {
            Metadata =
            {
                [PolicyPackCuratedRulesMetadataKey.V1] = CuratedJson(("z", "Z title")),
            },
        };

        ComplianceRulePack merged = TenantCuratedComplianceRulePackMerger.MergeFilePackWithCuratedFromGovernance(file, effective);

        merged.Rules.Select(r => r.RuleId).Should().ContainInOrder("x", "y", "z");
    }

    [Fact]
    public void Merge_TenantCuratedRule_Replaces_FileRule_WithSameId()
    {
        ComplianceRulePack file = Pack(FileRule("shared", "from-file"));
        PolicyPackContentDocument effective = new()
        {
            Metadata =
            {
                [PolicyPackCuratedRulesMetadataKey.V1] = CuratedJson(("shared", "from-tenant")),
            },
        };

        ComplianceRulePack merged = TenantCuratedComplianceRulePackMerger.MergeFilePackWithCuratedFromGovernance(file, effective);

        merged.Rules.Should().ContainSingle(r => r.RuleId == "shared");
        ComplianceRule r = merged.Rules.Single(x => x.RuleId == "shared");
        r.ControlName.Should().Be("from-tenant");
        r.AppliesToCategory.Should().Be(CuratedComplianceRuleMapper.TenantCuratedCategory);
    }

    [Fact]
    public void Merge_ThenGovernanceFilter_KeepsTenantKey()
    {
        ComplianceRulePack file = Pack(FileRule("drop-me"), FileRule("keep-file"));
        PolicyPackContentDocument effective = new()
        {
            ComplianceRuleKeys = ["tenant-only", "keep-file"],
            Metadata =
            {
                [PolicyPackCuratedRulesMetadataKey.V1] = CuratedJson(("tenant-only", "T")),
            },
        };

        ComplianceRulePack merged = TenantCuratedComplianceRulePackMerger.MergeFilePackWithCuratedFromGovernance(file, effective);
        ComplianceRulePack filtered = ComplianceRulePackGovernanceFilter.Filter(merged, effective);

        filtered.Rules.Select(r => r.RuleId).Should().BeEquivalentTo("tenant-only", "keep-file");
    }

    [Fact]
    public void Merge_WhenMetadataInvalidJson_ThrowsInvalidOperationException()
    {
        ComplianceRulePack file = Pack(FileRule("a"));
        PolicyPackContentDocument effective = new()
        {
            Metadata = { [PolicyPackCuratedRulesMetadataKey.V1] = "{ not json" },
        };

        Action act = () => TenantCuratedComplianceRulePackMerger.MergeFilePackWithCuratedFromGovernance(file, effective);

        act.Should().Throw<InvalidOperationException>().WithMessage($"*{PolicyPackCuratedRulesMetadataKey.V1}*");
    }
}
