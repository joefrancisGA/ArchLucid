using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Llm;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceLlmGatewayTests
{
    [Fact]
    public async Task ExtractElementsAsync_returns_null_when_client_missing()
    {
        ArchitectureIntelligenceLlmGateway gateway = new(new ServiceCollection().BuildServiceProvider());

        IReadOnlyList<ArchitectureModelElement>? result =
            await gateway.ExtractElementsAsync("component: api", "artifact-1");

        result.Should().BeNull();
    }

    [Fact]
    public async Task ExtractElementsAsync_parses_valid_json()
    {
        const string json = """
                            {
                              "elements": [
                                {
                                  "kind": "Component",
                                  "name": "Billing API",
                                  "description": "Handles invoices",
                                  "supportStatus": "DirectlyEstablished",
                                  "origin": "DirectlyExtracted",
                                  "confidence": 0.9,
                                  "notes": "Evidence-backed from source text."
                                }
                              ]
                            }
                            """;

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(json);

        ServiceCollection services = new();
        services.AddSingleton<IAgentCompletionClient>(client.Object);
        ArchitectureIntelligenceLlmGateway gateway = new(services.BuildServiceProvider());

        IReadOnlyList<ArchitectureModelElement>? result =
            await gateway.ExtractElementsAsync("component: Billing API", "artifact-1");

        result.Should().NotBeNull();
        result!.Should().ContainSingle();
        result[0].Name.Should().Be("Billing API");
        result[0].Kind.Should().Be(ArchitectureElementKind.Component);
    }

    [Fact]
    public async Task ExtractElementsAsync_returns_null_on_garbage_json()
    {
        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync("not-json");

        ServiceCollection services = new();
        services.AddSingleton<IAgentCompletionClient>(client.Object);
        ArchitectureIntelligenceLlmGateway gateway = new(services.BuildServiceProvider());

        IReadOnlyList<ArchitectureModelElement>? result =
            await gateway.ExtractElementsAsync("component: api", "artifact-1");

        result.Should().BeNull();
    }
}
