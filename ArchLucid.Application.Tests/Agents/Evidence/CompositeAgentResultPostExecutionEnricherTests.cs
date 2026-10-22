using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Agents.Evidence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CompositeAgentResultPostExecutionEnricherTests
{
    [Fact]
    public async Task EnrichAsync_invokes_registered_enrichers_in_order()
    {
        List<string> callOrder = [];
        Mock<IAgentResultPostExecutionEnricher> first = CreateTrackingEnricher(callOrder, "first");
        Mock<IAgentResultPostExecutionEnricher> second = CreateTrackingEnricher(callOrder, "second");
        CompositeAgentResultPostExecutionEnricher sut = new([first.Object, second.Object]);

        await sut.EnrichAsync(
            "run",
            new ArchitectureRequest { RequestId = "req", Description = new string('x', 12) },
            new AgentEvidencePackage(),
            [],
            CancellationToken.None);

        callOrder.Should().Equal("first", "second");
    }

    [Fact]
    public async Task EnrichAsync_with_empty_enricher_list_completes()
    {
        CompositeAgentResultPostExecutionEnricher sut = new([]);

        Func<Task> act = async () => await sut.EnrichAsync(
            "run",
            new ArchitectureRequest { RequestId = "req", Description = new string('x', 12) },
            new AgentEvidencePackage(),
            [],
            CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task EnrichAsync_propagates_exception_from_child_enricher()
    {
        Mock<IAgentResultPostExecutionEnricher> failing = new();
        failing
            .Setup(enricher => enricher.EnrichAsync(
                It.IsAny<string>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyList<AgentResult>>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("enricher failed"));

        CompositeAgentResultPostExecutionEnricher sut = new([failing.Object]);

        Func<Task> act = async () => await sut.EnrichAsync(
            "run",
            new ArchitectureRequest { RequestId = "req", Description = new string('x', 12) },
            new AgentEvidencePackage(),
            [],
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("enricher failed");
    }

    private static Mock<IAgentResultPostExecutionEnricher> CreateTrackingEnricher(List<string> callOrder, string label)
    {
        Mock<IAgentResultPostExecutionEnricher> enricher = new();
        enricher
            .Setup(e => e.EnrichAsync(
                It.IsAny<string>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<IReadOnlyList<AgentResult>>(),
                It.IsAny<CancellationToken>()))
            .Callback(() => callOrder.Add(label))
            .Returns(Task.CompletedTask);

        return enricher;
    }
}
