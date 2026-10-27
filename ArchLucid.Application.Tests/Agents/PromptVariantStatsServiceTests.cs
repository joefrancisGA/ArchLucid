using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Suite", "Core")]
public sealed class PromptVariantStatsServiceTests
{
    [Fact]
    public async Task GetStatsAsync_skips_null_repository_rows()
    {
        Mock<IPromptVariantStatsRepository> repository = new(MockBehavior.Strict);
        repository
            .Setup(r => r.GetStatsByTemplateAsync("topology-v1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                null!,
                new PromptVariantStatsRow
                {
                    VariantKey = "control",
                    SampleCount = 3,
                    MeanSemanticScore = 0.8,
                    MedianSemanticScore = 0.85,
                    QualityGatePassRate = 1.0,
                },
            ]);

        PromptVariantStatsService sut = new(repository.Object);

        PromptVariantStatsResponse response =
            await sut.GetStatsAsync("topology-v1", CancellationToken.None);

        response.Variants.Should().ContainSingle();
        response.Variants[0].VariantKey.Should().Be("control");
    }

    [Fact]
    public async Task GetStatsAsync_projects_rows_with_null_variant_key()
    {
        Mock<IPromptVariantStatsRepository> repository = new(MockBehavior.Strict);
        repository
            .Setup(r => r.GetStatsByTemplateAsync("topology-v1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PromptVariantStatsRow
                {
                    VariantKey = null!,
                    SampleCount = 1,
                    MeanSemanticScore = 0.5,
                    MedianSemanticScore = 0.5,
                    QualityGatePassRate = 0.0,
                },
            ]);

        PromptVariantStatsService sut = new(repository.Object);

        PromptVariantStatsResponse response =
            await sut.GetStatsAsync("topology-v1", CancellationToken.None);

        response.Variants.Should().ContainSingle();
        response.Variants[0].VariantKey.Should().BeNull();
    }
}
