using System.ClientModel;
using System.ClientModel.Primitives;
using System.Diagnostics;

using ArchLucid.Core.Diagnostics;

using FluentAssertions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureOpenAiTooManyRequestsRetryTests
{
    [Theory]
    [InlineData("0", 0)]
    [InlineData("15", 15)]
    [InlineData("  7 ", 7)]
    public void TryParseRetryAfterHeaderValue_accepts_delta_seconds(string raw, int expectedSeconds)
    {
        bool ok = AzureOpenAiTooManyRequestsRetry.TryParseRetryAfterHeaderValue(raw, out TimeSpan delay);

        ok.Should().BeTrue();
        delay.Should().Be(TimeSpan.FromSeconds(expectedSeconds));
    }

    [Fact]
    public void TryParseRetryAfterHeaderValue_rejects_negative_seconds()
    {
        AzureOpenAiTooManyRequestsRetry.TryParseRetryAfterHeaderValue("-1", out TimeSpan _).Should().BeFalse();
    }

    [Fact]
    public void TryParseRetryAfterHeaderValue_accepts_http_date_in_future()
    {
        string raw = DateTimeOffset.UtcNow.AddMinutes(2).ToString("R");

        bool ok = AzureOpenAiTooManyRequestsRetry.TryParseRetryAfterHeaderValue(raw, out TimeSpan delay);

        ok.Should().BeTrue();
        delay.Should().BeCloseTo(TimeSpan.FromMinutes(2), TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void GetDelayBeforeRetry_clamps_large_retry_after_header_to_product_max()
    {
        Mock<PipelineResponseHeaders> hdrs = new();
        string? retryAfter = "100000";
        hdrs.Setup(h => h.TryGetValue("Retry-After", out retryAfter)).Returns(true);

        using UnitPipelineResponse pr = new(429, hdrs.Object);

        ClientResultException ex = new("unit-too-many", pr);

        TimeSpan wait = AzureOpenAiTooManyRequestsRetry.GetDelayBeforeRetry(ex, 0, logger: null, out bool usedHeader);

        usedHeader.Should().BeTrue();
        wait.Should().Be(AzureOpenAiTooManyRequestsRetry.MaxRetryAfterDelay);
    }

    [Fact]
    public void GetDelayBeforeRetry_raises_sub_second_retry_after_to_minimum_throttle_delay()
    {
        Mock<PipelineResponseHeaders> hdrs = new();
        string? retryAfter = "0";
        hdrs.Setup(h => h.TryGetValue("Retry-After", out retryAfter)).Returns(true);

        using UnitPipelineResponse pr = new(429, hdrs.Object);

        ClientResultException ex = new("unit-too-many", pr);

        TimeSpan wait = AzureOpenAiTooManyRequestsRetry.GetDelayBeforeRetry(ex, 0, logger: null, out bool usedHeader);

        usedHeader.Should().BeTrue();
        wait.Should().Be(AzureOpenAiTooManyRequestsRetry.MinimumThrottleDelay);
    }

    [Fact]
    public void TryGetRetryAfterDelay_reads_Retry_After_from_ClientResult_headers()
    {
        Mock<PipelineResponseHeaders> hdrs = new();
        string? retryAfter = "4";
        hdrs.Setup(h => h.TryGetValue("Retry-After", out retryAfter)).Returns(true);

        using UnitPipelineResponse pr = new(429, hdrs.Object);

        ClientResultException ex = new("unit-too-many", pr);

        bool ok = AzureOpenAiTooManyRequestsRetry.TryGetRetryAfterDelay(ex, out TimeSpan delay);

        ok.Should().BeTrue();
        delay.Should().Be(TimeSpan.FromSeconds(4));
    }

    [Fact]
    public void GetDelayBeforeRetry_prefers_header_over_fallback()
    {
        Mock<PipelineResponseHeaders> hdrs = new();
        string? retryAfter = "12";
        hdrs.Setup(h => h.TryGetValue("Retry-After", out retryAfter)).Returns(true);

        using UnitPipelineResponse pr = new(429, hdrs.Object);

        ClientResultException ex = new("unit-too-many", pr);

        TimeSpan wait = AzureOpenAiTooManyRequestsRetry.GetDelayBeforeRetry(ex, 0, logger: null, out bool usedHeader);

        usedHeader.Should().BeTrue();
        wait.Should().Be(TimeSpan.FromSeconds(12));
    }

    [Fact]
    public void LlmRateLimitTotal_counter_accepts_tagged_increment()
    {
        TagList tags = [];

        tags.Add("retry_after", "header");

        Action act = () => ArchLucidInstrumentation.LlmRateLimitTotal.Add(1, tags);

        act.Should().NotThrow();
    }

    /// <summary>Minimal <see cref="PipelineResponse" /> for exercising 429 header parsing without the live SDK.</summary>
    private sealed class UnitPipelineResponse : PipelineResponse
    {
        public UnitPipelineResponse(int status, PipelineResponseHeaders headers)
        {
            Status = status;
            HeadersCore = headers;
        }

        public override int Status
        {
            get;
        }

        public override string ReasonPhrase => "unit";

        public override BinaryData Content => BinaryData.Empty;

        public override Stream? ContentStream
        {
            get;
            set;
        } = Stream.Null;

        protected override PipelineResponseHeaders HeadersCore
        {
            get;
        }
        public override BinaryData BufferContent(CancellationToken cancellationToken) => BinaryData.Empty;
        public override ValueTask<BinaryData> BufferContentAsync(CancellationToken cancellationToken) =>
            ValueTask.FromResult(BinaryData.Empty);
        public override void Dispose()
        {
        }
    }
}
