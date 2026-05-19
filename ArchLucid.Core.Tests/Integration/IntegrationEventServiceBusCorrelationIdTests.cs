using System.Diagnostics;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Integration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class IntegrationEventServiceBusCorrelationIdTests
{
    private static readonly ActivitySource TestSource = new("ArchLucid.Tests.IntegrationEventServiceBusCorrelationId");

    static IntegrationEventServiceBusCorrelationIdTests()
    {
        ActivityListener listener = new()
        {
            ShouldListenTo = s => s.Name == TestSource.Name,
            Sample = (ref _) => ActivitySamplingResult.AllData,
        };
        ActivitySource.AddActivityListener(listener);
    }

    [Fact]
    public void TryResolveForPublish_prefers_activity_correlation_over_payload()
    {
        byte[] utf8 = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { correlationId = "from-payload" }));

        using Activity? activity = TestSource.StartActivity("publish");
        activity?.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, "from-activity");

        string? resolved = IntegrationEventServiceBusCorrelationId.TryResolveForPublish(utf8);

        resolved.Should().Be("from-activity");
    }

    [Fact]
    public void TryResolveForPublish_reads_correlationId_from_payload_when_activity_unset()
    {
        byte[] utf8 = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { correlationId = " payload-corr " }));

        IntegrationEventServiceBusCorrelationId.TryResolveForPublish(utf8).Should().Be("payload-corr");
    }

    [Fact]
    public void TryResolveForPublish_returns_null_when_no_activity_and_payload_missing_correlationId()
    {
        byte[] utf8 = "{\"schemaVersion\":1}"u8.ToArray();

        IntegrationEventServiceBusCorrelationId.TryResolveForPublish(utf8).Should().BeNull();
    }

    [Fact]
    public void Trim_truncates_to_service_bus_max_length()
    {
        string longId = new('x', IntegrationEventServiceBusCorrelationId.MaxLength + 10);

        string trimmed = IntegrationEventServiceBusCorrelationId.Trim(longId);

        trimmed.Should().HaveLength(IntegrationEventServiceBusCorrelationId.MaxLength);
        trimmed.Should().Be(new string('x', IntegrationEventServiceBusCorrelationId.MaxLength));
    }
}
