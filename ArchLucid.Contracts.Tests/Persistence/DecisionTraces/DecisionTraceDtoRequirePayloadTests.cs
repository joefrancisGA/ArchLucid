using ArchLucid.Contracts.Persistence.DecisionTraces;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.DecisionTraces;

[Trait("Category", "Unit")]
public sealed class DecisionTraceDtoRequirePayloadTests
{
    [Fact]
    public void RequireRunEvent_returns_payload_for_run_event_dto()
    {
        RunEventTracePayload payload = new() { RunId = "run-1" };
        RunEventTraceDto dto = RunEventTraceDto.From(payload);

        RunEventTracePayload actual = dto.RequireRunEvent();

        actual.RunId.Should().Be("run-1");
    }

    [Fact]
    public void RequireRunEvent_throws_for_rule_audit_dto()
    {
        RuleAuditTraceDto dto = RuleAuditTraceDto.From(new RuleAuditTracePayload { RunId = Guid.NewGuid() });

        Action act = () => dto.RequireRunEvent();

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void RequireRuleAudit_returns_payload_for_rule_audit_dto()
    {
        Guid runId = Guid.NewGuid();
        RuleAuditTracePayload payload = new() { RunId = runId };
        RuleAuditTraceDto dto = RuleAuditTraceDto.From(payload);

        RuleAuditTracePayload actual = dto.RequireRuleAudit();

        actual.RunId.Should().Be(runId);
    }

    [Fact]
    public void RequireRuleAudit_throws_for_run_event_dto()
    {
        RunEventTraceDto dto = RunEventTraceDto.From(new RunEventTracePayload());

        Action act = () => dto.RequireRuleAudit();

        act.Should().Throw<InvalidOperationException>();
    }
}
