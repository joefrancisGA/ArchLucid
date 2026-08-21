using ArchLucid.Application.Planning;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Planning;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRequestDraftServiceTests
{
    [Fact]
    public async Task DraftAsync_parses_llm_json_shape()
    {
        const string json = """
                            {
                              "suggestedConstraints": ["Constraint A"],
                              "suggestedCapabilities": ["Capability A"],
                              "suggestedAssumptions": ["Assumption A"],
                              "topologyHints": ["Hint A"],
                              "securityBaselineHints": ["Baseline A"]
                            }
                            """;

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(json);

        ArchitectureRequestDraftService sut = new(client.Object);

        DraftArchitectureRequestResponse response = await sut.DraftAsync(
            new DraftArchitectureRequestInput { FreeTextDescription = "This is a sufficiently long architecture description." },
            CancellationToken.None);

        response.SuggestedConstraints.Should().ContainSingle().Which.Should().Be("Constraint A");
        response.SuggestedCapabilities.Should().ContainSingle().Which.Should().Be("Capability A");
        response.SuggestedAssumptions.Should().ContainSingle().Which.Should().Be("Assumption A");
        response.TopologyHints.Should().ContainSingle().Which.Should().Be("Hint A");
        response.SecurityBaselineHints.Should().ContainSingle().Which.Should().Be("Baseline A");
    }

    [Fact]
    public async Task DraftAsync_accepts_chat_intake_style_json_keys()
    {
        const string json = """
                            {
                              "constraints": ["Shared DB with TenantId"],
                              "requiredCapabilities": ["Tenant audit export"],
                              "assumptions": ["Pilot defers noisy-neighbor controls"],
                              "topologyHints": ["Hint A"],
                              "securityBaselineHints": ["Baseline A"]
                            }
                            """;

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(json);

        ArchitectureRequestDraftService sut = new(client.Object);

        DraftArchitectureRequestResponse response = await sut.DraftAsync(
            new DraftArchitectureRequestInput { FreeTextDescription = "Vertex B2B SaaS tenant migration platform overview." },
            CancellationToken.None);

        response.SuggestedConstraints.Should().ContainSingle().Which.Should().Be("Shared DB with TenantId");
        response.SuggestedCapabilities.Should().ContainSingle().Which.Should().Be("Tenant audit export");
        response.SuggestedAssumptions.Should().ContainSingle().Which.Should().Be("Pilot defers noisy-neighbor controls");
    }
}
