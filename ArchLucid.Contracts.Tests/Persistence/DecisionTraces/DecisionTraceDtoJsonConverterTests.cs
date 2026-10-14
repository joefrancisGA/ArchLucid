using System.Text.Json;

using ArchLucid.Contracts.Persistence.DecisionTraces;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.DecisionTraces;

[Trait("Category", "Unit")]
public sealed class DecisionTraceDtoJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        Converters = { new DecisionTraceDtoJsonConverter() },
    };

    [Fact]
    public void Round_trip_run_event_trace()
    {
        RunEventTraceDto original = RunEventTraceDto.From(new RunEventTracePayload
        {
            RunId = "run-1",
            EventType = "merge",
            EventDescription = "Merged findings",
        });

        string json = JsonSerializer.Serialize<DecisionTraceDto>(original, Options);
        DecisionTraceDto? roundTrip = JsonSerializer.Deserialize<DecisionTraceDto>(json, Options);

        roundTrip.Should().BeOfType<RunEventTraceDto>();
        RunEventTraceDto runEvent = (RunEventTraceDto)roundTrip!;
        runEvent.RunEvent.RunId.Should().Be("run-1");
        runEvent.RunEvent.EventType.Should().Be("merge");
    }

    [Fact]
    public void Round_trip_rule_audit_trace()
    {
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        RuleAuditTraceDto original = RuleAuditTraceDto.From(new RuleAuditTracePayload
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            RunId = runId,
            CreatedUtc = DateTime.UtcNow,
            RuleSetId = "pack-1",
        });

        string json = JsonSerializer.Serialize<DecisionTraceDto>(original, Options);
        DecisionTraceDto? roundTrip = JsonSerializer.Deserialize<DecisionTraceDto>(json, Options);

        roundTrip.Should().BeOfType<RuleAuditTraceDto>();
        RuleAuditTraceDto ruleAudit = (RuleAuditTraceDto)roundTrip!;
        ruleAudit.RuleAudit.RunId.Should().Be(runId);
    }

    [Fact]
    public void Read_throws_when_kind_missing()
    {
        string json = """{"runEvent":{"runId":"x"}}""";

        Action act = () => JsonSerializer.Deserialize<DecisionTraceDto>(json, Options);

        act.Should().Throw<JsonException>().WithMessage("*kind*");
    }

    [Fact]
    public void Read_throws_when_run_event_payload_missing()
    {
        string json = """{"kind":0}""";

        Action act = () => JsonSerializer.Deserialize<DecisionTraceDto>(json, Options);

        act.Should().Throw<JsonException>().WithMessage("*runEvent*");
    }

    [Fact]
    public void Deserialize_string_numeric_kind_maps_run_event_trace()
    {
        string json =
            """
            {"kind":"0","runEvent":{"runId":"run-1","eventType":"merge","eventDescription":"Merged findings"}}
            """;

        DecisionTraceDto? dto = JsonSerializer.Deserialize<DecisionTraceDto>(json, Options);

        dto.Should().BeOfType<RunEventTraceDto>();
    }

    [Fact]
    public void Deserialize_string_numeric_kind_out_of_range_throws()
    {
        string json = """{"kind":"99","runEvent":{"runId":"run-1"}}""";

        Action act = () => JsonSerializer.Deserialize<DecisionTraceDto>(json, Options);

        act.Should().Throw<JsonException>().WithMessage("*Unknown decision trace kind value*");
    }

    [Fact]
    public void Deserialize_whole_number_double_kind_maps_run_event_trace()
    {
        string json =
            """
            {"kind":0.0,"runEvent":{"runId":"run-1","eventType":"merge","eventDescription":"Merged findings"}}
            """;

        DecisionTraceDto? dto = JsonSerializer.Deserialize<DecisionTraceDto>(json, Options);

        dto.Should().BeOfType<RunEventTraceDto>();
    }
}
