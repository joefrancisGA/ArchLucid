using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class LlmBackedArchitectureExtractionServiceTests
{
    [Fact]
    public async Task ExtractAsync_falls_back_to_heuristics_when_llm_returns_garbage()
    {
        Mock<IArchitectureIntelligenceLlmGateway> gateway = new();
        gateway
            .Setup(g => g.ExtractElementsAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<ArchitectureModelElement>?)null);

        DifficultyBasedExtractionRouter heuristicRouter = new();
        LlmBackedArchitectureExtractionService service = new(gateway.Object, heuristicRouter);

        IReadOnlyList<ArchitectureModelElement> elements = await service.ExtractAsync(
            "component: Billing API",
            "artifact-1");

        elements.Should().NotBeEmpty();
        elements.Should().Contain(element => element.Name.Contains("Billing API", StringComparison.Ordinal));
    }
}
