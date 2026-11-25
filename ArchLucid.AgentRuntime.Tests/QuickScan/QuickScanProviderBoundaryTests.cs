using ArchLucid.AgentRuntime.QuickScan;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests.QuickScan;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class QuickScanProviderBoundaryTests
{
    [Theory]
    [InlineData("null")]
    [InlineData("[]")]
    public async Task ScanAsync_returns_an_unparseable_reply_for_a_nonobject_root(string json)
    {
        QuickScanResult result = await Create(_ => Task.FromResult(json)).ScanAsync(new Dictionary<string, string>());

        Assert.Equal("Failed to parse LLM response as JSON.", result.Summary);
        Assert.Empty(result.Findings);
    }

    [Fact]
    public async Task ScanAsync_preserves_valid_findings_beside_malformed_values()
    {
        const string json = """
            {"summary":123,"findings":[null,7,{"message":"kept","severity":"Warning","confidenceScore":0.5},
            {"message":false,"category":[],"severity":4,"confidenceLevel":[],"confidenceScore":"NaN"}]}
            """;

        QuickScanResult result = await Create(_ => Task.FromResult(json)).ScanAsync(new Dictionary<string, string>());

        Assert.Empty(result.Summary);
        Assert.Equal(2, result.Findings.Count);
        Assert.Equal("kept", result.Findings[0].Message);
        Assert.Equal(0.5, result.Findings[0].ConfidenceScore);
        Assert.Equal("Finding message was not stored.", result.Findings[1].Message);
        Assert.False(result.Findings[1].SeverityStored);
        Assert.Null(result.Findings[1].ConfidenceLevel);
        Assert.Null(result.Findings[1].ConfidenceScore);
    }

    [Theory]
    [InlineData("\"NaN\"")]
    [InlineData("\"Infinity\"")]
    [InlineData("1e500")]
    public async Task ScanAsync_does_not_store_nonfinite_confidence(string wire)
    {
        string json = "{\"findings\":[{\"message\":\"kept\",\"confidenceScore\":" + wire + "}]}";

        QuickScanResult result = await Create(_ => Task.FromResult(json)).ScanAsync(new Dictionary<string, string>());

        Assert.Null(Assert.Single(result.Findings).ConfidenceScore);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task ScanAsync_returns_a_bounded_failure_after_the_last_provider_error(bool providerTimeout)
    {
        QuickScanService sut = Create(_ => Task.FromException<string>(providerTimeout
            ? new TimeoutException("provider timed out independently of the scan deadline")
            : new HttpRequestException("provider failed")));

        QuickScanResult result = await sut.ScanAsync(new Dictionary<string, string>());

        Assert.Equal("Quick scan could not be completed.", result.Summary);
        Assert.Empty(result.Findings);
    }

    [Fact]
    public async Task ScanAsync_preserves_caller_cancellation_when_the_provider_throws_a_different_error()
    {
        using CancellationTokenSource caller = new();
        QuickScanService sut = Create(_ =>
        {
            caller.Cancel();
            return Task.FromException<string>(new HttpRequestException("provider failed during cancellation"));
        });

        OperationCanceledException error = await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => sut.ScanAsync(new Dictionary<string, string>(), caller.Token));

        Assert.Equal(caller.Token, error.CancellationToken);
    }

    private static QuickScanService Create(Func<CancellationToken, Task<string>> complete) =>
        new(new CompletionClient(complete),
            new FixedOptions<QuickScanOptions>(new() { MaxModelCallsPerScan = 1, MaxRetryCount = 0 }),
            new FixedOptions<QuickScanSafetyOptions>(new() { Enabled = false }),
            TimeProvider.System);

    private sealed class CompletionClient(Func<CancellationToken, Task<string>> complete) : IAgentCompletionClient
    {
        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("stub", "stub");

        public Task<string> CompleteJsonAsync(string systemPrompt, string userPrompt, int? maxTokens = null,
            float? temperature = null, CancellationToken cancellationToken = default) => complete(cancellationToken);
    }

    private sealed class FixedOptions<T>(T value) : IOptionsMonitor<T>
    {
        public T CurrentValue => value;
        public T Get(string? name) => value;
        public IDisposable? OnChange(Action<T, string?> listener) => null;
    }
}
