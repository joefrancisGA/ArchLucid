using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DecisionTraceRepositoryCoreTests
{
    [Fact]
    public void RequireRuleAudit_rejects_non_rule_audit_traces()
    {
        DecisionTraceDto trace = RunEventTraceDto.From(new RunEventTracePayload
        {
            RunId = Guid.NewGuid().ToString("N"),
            EventType = "test",
            EventDescription = "desc",
            CreatedUtc = DateTime.UtcNow,
        });

        Action act = () => DecisionTraceRepositoryCore.RequireRuleAudit(trace);

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void MapRow_round_trips_rule_audit_payload()
    {
        DecisionTraceRow row = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "hash",
            AppliedRuleIdsJson = "[\"r1\"]",
            AcceptedFindingIdsJson = "[]",
            RejectedFindingIdsJson = "[]",
            NotesJson = "[\"note\"]",
        };

        DecisionTraceDto mapped = DecisionTraceRepositoryCore.MapRow(row);
        RuleAuditTracePayload audit = mapped.RequireRuleAudit();

        audit.DecisionTraceId.Should().Be(row.DecisionTraceId);
        audit.AppliedRuleIds.Should().Equal("r1");
        audit.Notes.Should().Equal("note");
    }

    [Fact]
    public void MatchesIdAndScope_requires_matching_scope_and_id()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid traceId = Guid.NewGuid();
        RuleAuditTraceDto trace = RuleAuditTraceDto.From(new RuleAuditTracePayload
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            DecisionTraceId = traceId,
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "hash",
            AppliedRuleIds = [],
            AcceptedFindingIds = [],
            RejectedFindingIds = [],
            Notes = [],
        });

        DecisionTraceRepositoryCore.MatchesIdAndScope(trace, scope, traceId).Should().BeTrue();
        DecisionTraceRepositoryCore.MatchesIdAndScope(trace, scope, Guid.NewGuid()).Should().BeFalse();
    }

}
