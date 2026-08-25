using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureModelDiffPayloadSlimmerTests
{
    [Fact]
    public void WithoutModels_keeps_before_model_and_clears_after_model()
    {
        ArchitectureKnowledgeModel before = new()
        {
            ModelId = "before",
            Elements =
            [
                new ArchitectureModelElement { ElementId = "svc-before", Name = "Before API" },
            ],
        };
        ArchitectureKnowledgeModel after = new()
        {
            ModelId = "after",
            Elements =
            [
                new ArchitectureModelElement { ElementId = "svc-after", Name = "After API" },
            ],
        };

        ArchitectureModelDiff slim = ArchitectureModelDiffPayloadSlimmer.WithoutModels(new ArchitectureModelDiff
        {
            RecommendationId = "rec-1",
            Entries =
            [
                new ArchitectureModelDiffEntry
                {
                    ElementId = "svc-after",
                    ChangeKind = "Added",
                    Description = "Proposed recommendation",
                },
            ],
            BeforeModel = before,
            AfterModel = after,
        });

        slim.RecommendationId.Should().Be("rec-1");
        slim.Entries.Should().ContainSingle(entry => entry.ElementId == "svc-after");
        slim.BeforeModel.ModelId.Should().Be("before");
        slim.BeforeModel.Elements.Should().ContainSingle(element => element.ElementId == "svc-before");
        slim.AfterModel.ModelId.Should().BeNull();
        slim.AfterModel.Elements.Should().BeEmpty();
        slim.BeforeModel.Should().NotBeSameAs(before);
        before.Elements.Should().ContainSingle(element => element.ElementId == "svc-before");
        after.Elements.Should().ContainSingle(element => element.ElementId == "svc-after");
    }
}
