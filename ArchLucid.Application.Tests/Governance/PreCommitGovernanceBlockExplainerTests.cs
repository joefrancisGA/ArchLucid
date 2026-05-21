using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PreCommitGovernanceBlockExplainerTests
{
    [Fact]
    public async Task ExplainAsync_returns_trimmed_completion_text()
    {
        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync("  Explanation text.  ");

        PreCommitGovernanceBlockExplainer sut = new(completionClient.Object);
        PreCommitGateResult gateResult = new()
        {
            Blocked = true,
            Reason = "Blocked by rule",
            BlockingFindingIds = ["finding-1"]
        };

        string? explanation = await sut.ExplainAsync(gateResult, "{ \"manifestVersion\": \"v1\" }", CancellationToken.None);

        explanation.Should().Be("Explanation text.");
    }
}
