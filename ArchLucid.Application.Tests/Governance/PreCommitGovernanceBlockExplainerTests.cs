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

    [Fact]
    public async Task ExplainAsync_uses_honest_gate_field_labels_in_user_prompt()
    {
        Mock<IAgentCompletionClient> completionClient = new();
        string? capturedUserPrompt = null;
        completionClient
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .Callback<string, string, int?, float?, CancellationToken>((_, userPrompt, _, _, _) => capturedUserPrompt = userPrompt)
            .ReturnsAsync("Explanation text.");

        PreCommitGovernanceBlockExplainer sut = new(completionClient.Object);
        PreCommitGateResult gateResult = new()
        {
            Blocked = true,
            Reason = null,
            PolicyPackId = "",
            MinimumBlockingSeverity = null,
            BlockingFindingIds = [],
        };

        await sut.ExplainAsync(gateResult, "{ \"manifestVersion\": \"v1\" }", CancellationToken.None);

        capturedUserPrompt.Should().Contain("Gate reason was not stored.");
        capturedUserPrompt.Should().Contain("Policy pack id was stored empty.");
        capturedUserPrompt.Should().Contain("Minimum blocking severity was not stored.");
        capturedUserPrompt.Should().Contain("No blocking finding ids were stored on this gate result.");
    }
}
