using ArchLucid.Application.Planning;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Planning;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureOverviewRewriteServiceTests
{
    [Fact]
    public async Task RewriteAsync_returns_rewritten_overview_from_llm_json()
    {
        const string json = """
                            {
                              "rewrittenOverview": "Vertex is a tenant migration platform with EU residency and private networking."
                            }
                            """;

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(json);

        ArchitectureOverviewRewriteService sut = new(client.Object);

        RewriteArchitectureOverviewResponse response = await sut.RewriteAsync(
            new RewriteArchitectureOverviewInput
            {
                CurrentOverview = "Tenant migration platform with private networking and EU residency goals.",
                SystemName = "Vertex",
                StructuredBrief = new ArchitectureDraftStructuredBrief
                {
                    ConfirmedConstraints = ["EU data residency"],
                    DeniedAssumptions = ["Single-region pilot"],
                },
            },
            CancellationToken.None);

        response.RewrittenOverview.Should().Contain("EU residency");
    }

    [Fact]
    public void BuildUserPrompt_includes_confirmed_and_denied_brief_lists()
    {
        RewriteArchitectureOverviewInput input = new()
        {
            CurrentOverview = "Tenant migration platform with private networking and EU residency goals.",
            SystemName = "Vertex",
            BusinessOutcome = "Reduce review cycle time.",
            StructuredBrief = new ArchitectureDraftStructuredBrief
            {
                ConfirmedConstraints = ["EU data residency"],
                DeniedAssumptions = ["Single-region pilot"],
            },
        };

        string prompt = ArchitectureOverviewRewriteService.BuildUserPrompt(input, input.StructuredBrief);

        prompt.Should().Contain("System name: Vertex");
        prompt.Should().Contain("Business outcome: Reduce review cycle time.");
        prompt.Should().Contain("Confirmed constraints:");
        prompt.Should().Contain("- EU data residency");
        prompt.Should().Contain("Denied assumptions (strike or qualify):");
        prompt.Should().Contain("- Single-region pilot");
    }

    [Fact]
    public void BuildUserPrompt_omits_empty_brief_sections()
    {
        RewriteArchitectureOverviewInput input = new()
        {
            CurrentOverview = "Tenant migration platform with private networking and EU residency goals.",
            StructuredBrief = new ArchitectureDraftStructuredBrief(),
        };

        string prompt = ArchitectureOverviewRewriteService.BuildUserPrompt(input, input.StructuredBrief);

        prompt.Should().Contain("Current architecture overview:");
        prompt.Should().NotContain("Confirmed constraints:");
        prompt.Should().NotContain("Denied constraints");
    }
}
