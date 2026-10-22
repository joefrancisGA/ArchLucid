using ArchLucid.Contracts.Manifest;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Decisioning.Merge;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Merge;

[Trait("Category", "Unit")]
public sealed class DecisionNodeManifestMergerTests
{
    [Fact]
    public void ApplyDecisionNodes_does_not_add_private_endpoints_when_description_negates_them()
    {
        DecisionOption option = new()
        {
            Description = "Promote controls without private endpoints for sandbox workloads",
        };

        DecisionNode securityPromotion = new()
        {
            Topic = "SecurityControlPromotion",
            Options = [option],
            SelectedOptionId = option.OptionId,
        };

        GoldenManifest manifest = new();
        DecisionMergeResult output = new();

        new DecisionNodeManifestMerger().ApplyDecisionNodes(
            "run-1",
            [securityPromotion],
            manifest,
            output);

        manifest.Governance.RequiredControls.Should().NotContain("Private Endpoints");
    }

    [Fact]
    public void ApplyDecisionNodes_does_not_add_managed_identity_when_description_mentions_unmanaged_identity()
    {
        DecisionOption option = new()
        {
            Description = "Promote controls: unmanaged identity only for legacy adapters",
        };

        DecisionNode securityPromotion = new()
        {
            Topic = "SecurityControlPromotion",
            Options = [option],
            SelectedOptionId = option.OptionId,
        };

        GoldenManifest manifest = new();
        DecisionMergeResult output = new();

        new DecisionNodeManifestMerger().ApplyDecisionNodes(
            "run-1",
            [securityPromotion],
            manifest,
            output);

        manifest.Governance.RequiredControls.Should().NotContain("Managed Identity");
    }

    [Fact]
    public void ApplyDecisionNodes_adds_controls_when_description_affirmatively_promotes_them()
    {
        DecisionOption option = new()
        {
            Description = "Promote controls: Private Endpoints, Managed Identity",
        };

        DecisionNode securityPromotion = new()
        {
            Topic = "SecurityControlPromotion",
            Options = [option],
            SelectedOptionId = option.OptionId,
        };

        GoldenManifest manifest = new();
        DecisionMergeResult output = new();

        new DecisionNodeManifestMerger().ApplyDecisionNodes(
            "run-1",
            [securityPromotion],
            manifest,
            output);

        manifest.Governance.RequiredControls.Should().Contain(["Private Endpoints", "Managed Identity"]);
    }
}
