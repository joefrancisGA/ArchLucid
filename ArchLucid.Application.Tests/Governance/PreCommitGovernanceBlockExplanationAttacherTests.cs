using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PreCommitGovernanceBlockExplanationAttacherTests
{
    [Fact]
    public async Task TryExplainAsync_returns_null_when_feature_flag_disabled()
    {
        Mock<IPreCommitGovernanceBlockExplainer> explainer = new();
        PreCommitGateResult gateResult = new() { Blocked = true, Reason = "Blocked" };

        string? explanation = await PreCommitGovernanceBlockExplanationAttacher.TryExplainAsync(
            explainer.Object,
            Options.Create(new ExplainGovernanceBlocksOptions { Enabled = false }),
            Mock.Of<ILogger>(),
            Guid.NewGuid().ToString("D"),
            gateResult,
            "{ \"manifestVersion\": \"v1\" }",
            CancellationToken.None);

        explanation.Should().BeNull();
        explainer.Verify(
            e => e.ExplainAsync(It.IsAny<PreCommitGateResult>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryAttachToGateResultAsync_sets_block_explanation_when_enabled()
    {
        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync("Explanation text.");

        PreCommitGovernanceBlockExplainer explainer = new(completionClient.Object);
        PreCommitGateResult gateResult = new()
        {
            Blocked = true,
            Reason = "Blocked by rule",
            BlockingFindingIds = ["finding-1"],
        };

        PreCommitGateResult result = await PreCommitGovernanceBlockExplanationAttacher.TryAttachToGateResultAsync(
            explainer,
            Options.Create(new ExplainGovernanceBlocksOptions { Enabled = true }),
            Mock.Of<ILogger>(),
            Guid.NewGuid().ToString("D"),
            gateResult,
            PreCommitGovernanceBlockExplanationAttacher.BuildReadinessGateContextExcerpt(gateResult),
            CancellationToken.None);

        result.BlockExplanation.Should().Be("Explanation text.");
    }
}
