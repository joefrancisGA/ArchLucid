using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

internal static class GoldenCorpusAssignedPackSupport
{
    internal static IComplianceRulePackProvider CreateProvider(GoldenCorpusAssignedPackFixtureDocument fixture)
    {
        ArgumentNullException.ThrowIfNull(fixture);

        if (fixture.ComplianceRuleKeys.Count == 0)
        {
            throw new InvalidOperationException(
                "Golden corpus assignedPackFixture requires at least one complianceRuleKey.");
        }

        ComplianceRulePack pack = new()
        {
            RulePackId = "golden-corpus-assigned-pack",
            Name = "Golden corpus assigned pack fixture",
            Version = "1",
            Rules = fixture.ComplianceRuleKeys
                .Select(
                    static ruleId => new ComplianceRule
                    {
                        RuleId = ruleId,
                        ControlId = "c",
                        ControlName = "n",
                        AppliesToCategory = "cat",
                        RequiredNodeType = "t",
                        RequiredEdgeType = "e",
                        Description = "d",
                    })
                .ToList(),
        };

        return new FixedComplianceRulePackProvider(pack);
    }
}
