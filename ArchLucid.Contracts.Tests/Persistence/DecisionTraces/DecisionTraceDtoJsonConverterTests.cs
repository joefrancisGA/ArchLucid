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
}
