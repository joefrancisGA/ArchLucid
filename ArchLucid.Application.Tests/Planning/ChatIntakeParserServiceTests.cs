using ArchLucid.Application.Planning;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Planning;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ChatIntakeParserServiceTests
{
    [Fact]
    public async Task ParseAsync_maps_llm_json_to_architecture_request()
    {
        const string json = """
                            {
                              "description": "We need a secure multi-region order processing platform on Azure with private endpoints.",
                              "systemName": "OrderPlatform",
                              "environment": "staging",
                              "cloudProvider": "Azure",
                              "constraints": ["Must use private endpoints"],
                              "requiredCapabilities": ["Order intake"],
                              "assumptions": ["Existing Entra tenant"],
                              "inlineRequirements": ["PCI scope for card data"],
                              "policyReferences": ["SecurityBaselineV1"],
                              "topologyHints": ["Active-active region pair"],
                              "securityBaselineHints": ["Encrypt data at rest"]
                            }
                            """;

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(json);

        ChatIntakeParserService sut = new(client.Object);

        ArchitectureRequest response = await sut.ParseAsync(
            new ChatIntakeRequest { RawText = "Paste from Slack: build order platform on Azure with PCI." },
            CancellationToken.None);

        response.SystemName.Should().Be("OrderPlatform");
        response.Environment.Should().Be("staging");
        response.CloudProvider.Should().Be(Contracts.Common.CloudProvider.Azure);
        response.Constraints.Should().ContainSingle().Which.Should().Be("Must use private endpoints");
        response.InlineRequirements.Should().ContainSingle().Which.Should().Be("PCI scope for card data");
        response.RequestId.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task ParseAsync_falls_back_to_raw_text_when_description_is_too_short()
    {
        const string raw = "This is a sufficiently long unstructured architecture brief pasted from a ticket.";
        const string json = """
                            {
                              "description": "short",
                              "systemName": "",
                              "environment": "",
                              "cloudProvider": "None",
                              "constraints": [],
                              "requiredCapabilities": [],
                              "assumptions": [],
                              "inlineRequirements": [],
                              "policyReferences": [],
                              "topologyHints": [],
                              "securityBaselineHints": []
                            }
                            """;

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(json);

        ChatIntakeParserService sut = new(client.Object);

        ArchitectureRequest response = await sut.ParseAsync(new ChatIntakeRequest { RawText = raw }, CancellationToken.None);

        response.Description.Should().Be(raw);
        response.SystemName.Should().Be("This");
        response.Environment.Should().Be("prod");
        response.CloudProvider.Should().Be(Contracts.Common.CloudProvider.None);
    }

    [Fact]
    public async Task ParseAsync_maps_aws_cloud_provider_from_llm_json()
    {
        const string json = """
                            {
                              "description": "Primary workload runs in AWS us-east-1 with IAM roles per service.",
                              "systemName": "PaymentsCore",
                              "environment": "prod",
                              "cloudProvider": "Aws",
                              "constraints": [],
                              "requiredCapabilities": [],
                              "assumptions": [],
                              "inlineRequirements": [],
                              "policyReferences": [],
                              "topologyHints": [],
                              "securityBaselineHints": []
                            }
                            """;

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(json);

        ChatIntakeParserService sut = new(client.Object);

        ArchitectureRequest response = await sut.ParseAsync(
            new ChatIntakeRequest { RawText = "Build payments on AWS with IAM roles." },
            CancellationToken.None);

        response.CloudProvider.Should().Be(Contracts.Common.CloudProvider.Aws);
    }

    [Fact]
    public async Task ParseAsync_maps_gcp_cloud_provider_from_llm_json()
    {
        const string json = """
                            {
                              "description": "Services run on Google Cloud in us-central1 with VPC Service Controls.",
                              "systemName": "AnalyticsHub",
                              "environment": "staging",
                              "cloudProvider": "Gcp",
                              "constraints": [],
                              "requiredCapabilities": [],
                              "assumptions": [],
                              "inlineRequirements": [],
                              "policyReferences": [],
                              "topologyHints": [],
                              "securityBaselineHints": []
                            }
                            """;

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(json);

        ChatIntakeParserService sut = new(client.Object);

        ArchitectureRequest response = await sut.ParseAsync(
            new ChatIntakeRequest { RawText = "Analytics platform on GCP with VPC SC." },
            CancellationToken.None);

        response.CloudProvider.Should().Be(Contracts.Common.CloudProvider.Gcp);
    }
}
