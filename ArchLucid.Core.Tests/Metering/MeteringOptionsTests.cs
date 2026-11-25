using ArchLucid.Core.Metering;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Metering;

[Trait("Suite", "Core")]
public sealed class MeteringOptionsTests
{
    [Theory]
    [InlineData(0, 9999, 1, 500)]
    [InlineData(61, 0, 60, 1)]
    [InlineData(60, 1, 60, 1)]
    [InlineData(37, 127, 37, 127)]
    public void Normalize_clamps_api_request_batch_settings(
        int interval, int batchSize, int expectedInterval, int expectedBatchSize)
    {
        MeteringOptions options = new()
        {
            ApiRequestBatchFlushIntervalSeconds = interval,
            ApiRequestBatchMaxSize = batchSize,
        };

        options.Normalize();

        options.ApiRequestBatchFlushIntervalSeconds.Should().Be(expectedInterval);
        options.ApiRequestBatchMaxSize.Should().Be(expectedBatchSize);
    }
}
