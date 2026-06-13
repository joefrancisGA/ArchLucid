using ArchLucid.AgentRuntime;

using ArchLucid.Core;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CostGuardrailInterceptorTests
{
    [Fact]
    public async Task CompleteJsonAsync_when_token_budget_exceeded_throws_token_kind()
    {
        Mock<IAgentCompletionClient> inner = new();
        inner.Setup(i => i.Descriptor).Returns(LlmProviderDescriptor.ForAzureOpenAi(new Uri("https://x"), "d"));
        inner.Setup(i => i.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("{}")
            .Callback(() => AzureOpenAiCompletionClient.SeedLastCompletionTokenUsageForTests(600, 500));

        CostGuardrailInterceptor sut = new(
            inner.Object,
            Options.Create(new AgentOutputQualityGateOptions { MaxTokensPerRun = 1_000 }),
            Mock.Of<ILlmCostEstimator>());

        Func<Task> act = async () => await sut.CompleteJsonAsync("s", "u");

        CostLimitExceededException ex = (await act.Should().ThrowAsync<CostLimitExceededException>()).Which;
        ex.Kind.Should().Be(CostLimitExceededKind.RunTokenBudget);
    }

    [Fact]
    public async Task CompleteJsonAsync_when_cost_budget_exceeded_throws_cost_kind()
    {
        Mock<IAgentCompletionClient> inner = new();
        inner.Setup(i => i.Descriptor).Returns(LlmProviderDescriptor.ForAzureOpenAi(new Uri("https://x"), "d"));
        inner.Setup(i => i.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("{}")
            .Callback(() => AzureOpenAiCompletionClient.SeedLastCompletionTokenUsageForTests(100, 50));

        Mock<ILlmCostEstimator> estimator = new();
        estimator.Setup(e => e.EstimateUsd(100, 50, 0, null)).Returns(200m);

        CostGuardrailInterceptor sut = new(
            inner.Object,
            Options.Create(new AgentOutputQualityGateOptions { MaxCostPerRun = 100m }),
            estimator.Object);

        Func<Task> act = async () => await sut.CompleteJsonAsync("s", "u");

        CostLimitExceededException ex = (await act.Should().ThrowAsync<CostLimitExceededException>()).Which;
        ex.Kind.Should().Be(CostLimitExceededKind.RunCostUsd);
    }
}
