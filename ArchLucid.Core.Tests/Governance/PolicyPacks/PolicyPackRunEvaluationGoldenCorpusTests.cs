using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Governance.PolicyPacks;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PolicyPackRunEvaluationGoldenCorpusTests
{
    public static TheoryData<string, bool, CloudProvider, bool> FocusedPilotBaselineMatrix => new()
    {
        { PolicyPackBundledSlugs.SecurityArchitectureBaseline, true, CloudProvider.Azure, true },
        { PolicyPackBundledSlugs.ReliabilityAndResilience, true, CloudProvider.Azure, true },
        { PolicyPackBundledSlugs.CostOptimization, true, CloudProvider.Azure, true },
        { PolicyPackBundledSlugs.PerformanceAndScalability, true, CloudProvider.Azure, true },
        { PolicyPackBundledSlugs.OperationalExcellence, true, CloudProvider.Azure, true },
        { PolicyPackBundledSlugs.SustainabilityAndResourceEfficiency, true, CloudProvider.Azure, true },
        { "ai-governance-responsible-ai", true, CloudProvider.Azure, false },
        { PolicyPackBundledSlugs.AzureWellArchitected, true, CloudProvider.Azure, true },
        { PolicyPackBundledSlugs.AzureWellArchitected, true, CloudProvider.Aws, false },
        { PolicyPackBundledSlugs.AwsWellArchitected, true, CloudProvider.Aws, true },
        { PolicyPackBundledSlugs.GcpArchitectureFramework, true, CloudProvider.Gcp, true },
    };

    [Theory]
    [MemberData(nameof(FocusedPilotBaselineMatrix))]
    public void Focused_pilot_inclusion_matches_slug_corpus(
        string packSlug,
        bool focusedPilotEnabled,
        CloudProvider cloudProvider,
        bool expectedIncluded)
    {
        PolicyPack pack = new()
        {
            PackSlug = packSlug,
            Name = "Display name is not used when slug is set",
        };

        PolicyPackAssignment assignment = new()
        {
            IsEnabled = true,
        };

        bool included = PolicyPackRunEvaluationScope.IsPackIncludedInRunEvaluation(
            pack,
            assignment,
            focusedPilotEnabled,
            cloudProvider);

        included.Should().Be(expectedIncluded);
    }

    [Fact]
    public void Organization_required_pack_stays_included_in_focused_pilot_even_when_disabled()
    {
        PolicyPack pack = new()
        {
            PackSlug = "ai-governance-responsible-ai",
            Name = "AI Governance / Responsible AI",
        };

        PolicyPackAssignment assignment = new()
        {
            IsEnabled = false,
            IsOrganizationRequired = true,
        };

        bool included = PolicyPackRunEvaluationScope.IsPackIncludedInRunEvaluation(
            pack,
            assignment,
            focusedPilotModeEnabled: true,
            CloudProvider.Azure);

        included.Should().BeTrue();
    }
}
