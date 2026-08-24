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

        Mock<IArchitectureRequestDraftSemanticUniquePass> semanticPass = CreatePassThroughSemanticPassMock();
        Mock<IBriefAssumptionEvidenceContradictionPass> contradictionPass = CreateEmptyContradictionPassMock();

        ArchitectureRequestDraftService sut = new(client.Object, semanticPass.Object, contradictionPass.Object);

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

        Mock<IArchitectureRequestDraftSemanticUniquePass> semanticPass = CreatePassThroughSemanticPassMock();
        Mock<IBriefAssumptionEvidenceContradictionPass> contradictionPass = CreateEmptyContradictionPassMock();

        ArchitectureRequestDraftService sut = new(client.Object, semanticPass.Object, contradictionPass.Object);

        DraftArchitectureRequestResponse response = await sut.DraftAsync(
            new DraftArchitectureRequestInput { FreeTextDescription = "Vertex B2B SaaS tenant migration platform overview." },
            CancellationToken.None);

        response.SuggestedConstraints.Should().ContainSingle().Which.Should().Be("Shared DB with TenantId");
        response.SuggestedCapabilities.Should().ContainSingle().Which.Should().Be("Tenant audit export");
        response.SuggestedAssumptions.Should().ContainSingle().Which.Should().Be("Pilot defers noisy-neighbor controls");
    }

    [Fact]
    public async Task DraftAsync_applies_semantic_unique_pass_to_constraints_and_assumptions()
    {
        const string json = """
                            {
                              "suggestedConstraints": ["Support for mobile and web", "Mobile and web support"],
                              "suggestedAssumptions": ["Stable internet connection", "Constant internet access"],
                              "suggestedCapabilities": ["Capability A"]
                            }
                            """;

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(json);

        Mock<IArchitectureRequestDraftSemanticUniquePass> semanticPass = new();
        semanticPass
            .Setup(p => p.FilterDuplicatesAsync(
                ArchitectureRequestDraftListKind.Constraints,
                It.IsAny<IReadOnlyList<string>>(),
                It.Is<string[]>(items => items.Length == 2),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(["Support for mobile and web"]);

        semanticPass
            .Setup(p => p.FilterDuplicatesAsync(
                ArchitectureRequestDraftListKind.Assumptions,
                It.IsAny<IReadOnlyList<string>>(),
                It.Is<string[]>(items => items.Length == 2),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(["Stable internet connection"]);

        ArchitectureRequestDraftService sut = new(
            client.Object,
            semanticPass.Object,
            CreateEmptyContradictionPassMock().Object);

        DraftArchitectureRequestResponse response = await sut.DraftAsync(
            new DraftArchitectureRequestInput
            {
                FreeTextDescription = "This is a sufficiently long architecture description.",
                CurrentConstraints = ["Cloud-based hosting"],
                CurrentAssumptions = ["Existing database infrastructure"],
            },
            CancellationToken.None);

        response.SuggestedConstraints.Should().ContainSingle().Which.Should().Be("Support for mobile and web");
        response.SuggestedAssumptions.Should().ContainSingle().Which.Should().Be("Stable internet connection");

        semanticPass.Verify(
            p => p.FilterDuplicatesAsync(
                ArchitectureRequestDraftListKind.Constraints,
                It.Is<IReadOnlyList<string>>(items => items.Contains("Cloud-based hosting")),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()),
            Times.Once);

        semanticPass.Verify(
            p => p.FilterDuplicatesAsync(
                ArchitectureRequestDraftListKind.Assumptions,
                It.Is<IReadOnlyList<string>>(items => items.Contains("Existing database infrastructure")),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public void BuildDraftUserPrompt_includes_current_constraints_and_assumptions()
    {
        string prompt = ArchitectureRequestDraftService.BuildDraftUserPrompt(
            new DraftArchitectureRequestInput
            {
                FreeTextDescription = "Overview text for the architecture request draft.",
                CurrentConstraints = ["Encryption at rest"],
                CurrentAssumptions = ["Stable internet connection"],
            });

        prompt.Should().Contain("Overview text for the architecture request draft.");
        prompt.Should().Contain("Encryption at rest");
        prompt.Should().Contain("Stable internet connection");
    }

    private static Mock<IArchitectureRequestDraftSemanticUniquePass> CreatePassThroughSemanticPassMock()
    {
        Mock<IArchitectureRequestDraftSemanticUniquePass> semanticPass = new();
        semanticPass
            .Setup(p => p.FilterDuplicatesAsync(
                It.IsAny<ArchitectureRequestDraftListKind>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRequestDraftListKind _, IReadOnlyList<string> _, IReadOnlyList<string> candidates, CancellationToken _) =>
                candidates is string[] array ? array : candidates.ToArray());

        return semanticPass;
    }

    private static Mock<IBriefAssumptionEvidenceContradictionPass> CreateEmptyContradictionPassMock()
    {
        Mock<IBriefAssumptionEvidenceContradictionPass> contradictionPass = new();
        contradictionPass
            .Setup(p => p.DetectAsync(
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return contradictionPass;
    }
}
