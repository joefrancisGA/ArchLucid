using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopModelDiffSlimmerTests
{
    [Fact]
    public void WithoutModels_strips_after_model_from_each_closed_loop_diff()
    {
        ArchitectureKnowledgeModel before = new()
        {
            ModelId = "before",
            Elements = [new ArchitectureModelElement { ElementId = "e1", Name = "API" }],
        };
        ArchitectureKnowledgeModel after = new()
        {
            ModelId = "after",
            Elements = [new ArchitectureModelElement { ElementId = "e2", Name = "API hardened" }],
        };

        List<ArchitectureModelDiff> slim = [
            ArchitectureModelDiffPayloadSlimmer.WithoutModels(new ArchitectureModelDiff
            {
                RecommendationId = "rec-1",
                Entries = [new ArchitectureModelDiffEntry { ElementId = "e2", ChangeKind = "Added" }],
                BeforeModel = before,
                AfterModel = after,
            }),
        ];

        slim.Should().ContainSingle(diff => diff.RecommendationId == "rec-1");
        slim[0].Entries.Should().ContainSingle(entry => entry.ElementId == "e2");
        slim[0].BeforeModel.Elements.Should().ContainSingle(element => element.ElementId == "e1");
        slim[0].AfterModel.Elements.Should().BeEmpty();
    }
}
