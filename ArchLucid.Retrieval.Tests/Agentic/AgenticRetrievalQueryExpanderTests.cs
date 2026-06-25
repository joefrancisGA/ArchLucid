using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Agentic;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Retrieval.Tests.Agentic;

[Trait("Category", "Unit")]
public sealed class AgenticRetrievalQueryExpanderTests
{
    [Fact]
    public async Task ExpandAsync_when_disabled_returns_passthrough_plan()
    {
        AgenticRetrievalQueryExpander sut = CreateSut(new AdvancedRetrievalOptions { Enabled = false });

        AgenticRetrievalQueryPlan plan = await sut.ExpandAsync("subnet isolation", CancellationToken.None);

        plan.EmbedText.Should().Be("subnet isolation");
        plan.UsedHyde.Should().BeFalse();
        plan.UsedQueryRewrite.Should().BeFalse();
    }

    [Fact]
    public async Task ExpandAsync_when_enabled_applies_rewrite_and_hyde()
    {
        Mock<IAgenticRetrievalCompletionClient> completionClient = new();
        completionClient
            .Setup(c => c.RewriteQueryAsync("subnet isolation", It.IsAny<CancellationToken>()))
            .ReturnsAsync("rewrite: subnet isolation policy");
        completionClient
            .Setup(c => c.GenerateHydeDocumentAsync("rewrite: subnet isolation policy", It.IsAny<CancellationToken>()))
            .ReturnsAsync("HyDE document about subnet isolation");

        AgenticRetrievalQueryExpander sut = CreateSut(
            new AdvancedRetrievalOptions
            {
                Enabled = true,
                EnableQueryRewrite = true,
                EnableHyde = true,
            },
            completionClient.Object);

        AgenticRetrievalQueryPlan plan = await sut.ExpandAsync("subnet isolation", CancellationToken.None);

        plan.RerankQueryText.Should().Be("rewrite: subnet isolation policy");
        plan.EmbedText.Should().Be("HyDE document about subnet isolation");
        plan.UsedQueryRewrite.Should().BeTrue();
        plan.UsedHyde.Should().BeTrue();
    }

    private static AgenticRetrievalQueryExpander CreateSut(
        AdvancedRetrievalOptions options,
        IAgenticRetrievalCompletionClient? completionClient = null)
    {
        return new AgenticRetrievalQueryExpander(
            completionClient ?? new HeuristicAgenticRetrievalCompletionClient(),
            new MockOptionsMonitor<AdvancedRetrievalOptions>(options),
            Mock.Of<ILogger<AgenticRetrievalQueryExpander>>());
    }

    private sealed class MockOptionsMonitor<T>(T value) : IOptionsMonitor<T> where T : class
    {
        public T CurrentValue => value;

        public T Get(string? name) => value;

        public IDisposable OnChange(Action<T, string?> listener) => NullDisposable.Instance;

        private sealed class NullDisposable : IDisposable
        {
            internal static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
