using ArchLucid.Core.Metering;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Metering;

[Trait("Suite", "Core")]
public sealed class MeteringOptionsTests
{
    [Fact]
    public void Normalize_clamps_api_request_batch_settings()
    {
        MeteringOptions options = new()
        {
            ApiRequestBatchFlushIntervalSeconds = 0,
            ApiRequestBatchMaxSize = 9999,
        };

        options.Normalize();

        options.ApiRequestBatchFlushIntervalSeconds.Should().Be(1);
        options.ApiRequestBatchMaxSize.Should().Be(500);
    }
}
