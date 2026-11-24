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
    public void TryResolveForPublish_reads_PascalCase_correlationId_from_payload_when_activity_unset()
    {
        byte[] utf8 = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { CorrelationId = " payload-pascal " }));

        IntegrationEventServiceBusCorrelationId.TryResolveForPublish(utf8).Should().Be("payload-pascal");
    }

    [Fact]
    public void TryResolveForPublish_reads_correlationId_from_payload_when_activity_unset()
    {
        byte[] utf8 = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { correlationId = " payload-corr " }));

        IntegrationEventServiceBusCorrelationId.TryResolveForPublish(utf8).Should().Be("payload-corr");
    }

    [Fact]
    public void TryResolveForPublish_reads_PascalCase_CorrelationId_from_payload_when_activity_unset()
    {
        byte[] utf8 = "{\"schemaVersion\":1,\"CorrelationId\":\"pascal-corr\"}"u8.ToArray();

        IntegrationEventServiceBusCorrelationId.TryResolveForPublish(utf8).Should().Be("pascal-corr");
    }

    [Fact]
    public void TryResolveForPublish_reads_numeric_correlationId_from_payload_when_activity_unset()
    {
        byte[] utf8 = "{\"schemaVersion\":1,\"correlationId\":42424242}"u8.ToArray();

        IntegrationEventServiceBusCorrelationId.TryResolveForPublish(utf8).Should().Be("42424242");
    }

    [Fact]
    public void TryResolveForPublish_reads_boolean_correlationId_from_payload_when_activity_unset()
    {
        byte[] utf8 = "{\"schemaVersion\":1,\"correlationId\":true}"u8.ToArray();

        IntegrationEventServiceBusCorrelationId.TryResolveForPublish(utf8).Should().Be("true");
    }

    [Fact]
    public void TryResolveForPublish_reads_whole_number_double_correlationId_from_payload_when_activity_unset()
    {
        byte[] utf8 = "{\"schemaVersion\":1,\"correlationId\":42424242.0}"u8.ToArray();

        IntegrationEventServiceBusCorrelationId.TryResolveForPublish(utf8).Should().Be("42424242");
    }

    [Fact]
    public void TryResolveForPublish_reads_string_encoded_whole_number_double_correlationId_from_payload_when_activity_unset()
    {
        byte[] utf8 = "{\"schemaVersion\":1,\"correlationId\":\"42424242.0\"}"u8.ToArray();

        IntegrationEventServiceBusCorrelationId.TryResolveForPublish(utf8).Should().Be("42424242");
    }

    [Fact]
    public void TryResolveForPublish_reads_string_encoded_boolean_correlationId_from_payload_when_activity_unset()
    {
        byte[] utf8 = "{\"schemaVersion\":1,\"correlationId\":\"True\"}"u8.ToArray();

        IntegrationEventServiceBusCorrelationId.TryResolveForPublish(utf8).Should().Be("true");
    }

    [Fact]
    public void TryResolveForPublish_reads_string_encoded_on_correlationId_from_payload_when_activity_unset()
    {
        byte[] utf8 = "{\"schemaVersion\":1,\"correlationId\":\"on\"}"u8.ToArray();

        IntegrationEventServiceBusCorrelationId.TryResolveForPublish(utf8).Should().Be("true");
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

    [Theory]
    [InlineData("[]")]
    [InlineData("null")]
    [InlineData("42")]
    [InlineData("\"scalar\"")]
    [InlineData("""{"correlationId":9223372036854775808.0}""")]
    public void TryResolveForPublish_invalid_shape_or_out_of_range_number_returns_null(string json)
    {
        IntegrationEventServiceBusCorrelationId.TryResolveForPublish(Encoding.UTF8.GetBytes(json)).Should().BeNull();
    }

    [Theory]
    [InlineData("""{"correlationId":9007199254740993.0}""", "9007199254740993")]
    [InlineData("""{"correlationId":"9007199254740993.0"}""", "9007199254740993")]
    [InlineData("""{"correlationId":9223372036854775807.0}""", "9223372036854775807")]
    [InlineData("""{"correlationId":"9223372036854775808.0"}""", "9223372036854775808.0")]
    public void TryResolveForPublish_preserves_numeric_identity_without_double_rounding(string json, string expected)
    {
        var result = IntegrationEventServiceBusCorrelationId.TryResolveForPublish(Encoding.UTF8.GetBytes(json));
        result.Should().Be(expected);
    }
}
