using System.Text.Json;

using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingInstrumentationAuditSupportTests
{
    [Fact]
    public void BuildFeedbackAuditPayload_includes_comment_for_checklist_coverage()
    {
        object payload = FindingInstrumentationAuditSupport.BuildFeedbackAuditPayload(
            "finding-1",
            1,
            FindingClassification.ChecklistCoverage,
            "helpful context");

        string json = JsonSerializer.Serialize(payload, AuditJsonSerializationOptions.Instance);
        using JsonDocument doc = JsonDocument.Parse(json);

        doc.RootElement.GetProperty("comment").GetString().Should().Be("helpful context");
        doc.RootElement.TryGetProperty("commentOmitted", out _).Should().BeFalse();
    }

    [Fact]
    public void BuildFeedbackAuditPayload_omits_comment_for_decision_grade()
    {
        object payload = FindingInstrumentationAuditSupport.BuildFeedbackAuditPayload(
            "finding-1",
            -1,
            FindingClassification.DecisionGradeFinding,
            "should not appear");

        string json = JsonSerializer.Serialize(payload, AuditJsonSerializationOptions.Instance);
        using JsonDocument doc = JsonDocument.Parse(json);

        doc.RootElement.TryGetProperty("comment", out _).Should().BeFalse();
        doc.RootElement.GetProperty("commentOmitted").GetBoolean().Should().BeTrue();
        doc.RootElement.GetProperty("score").GetInt32().Should().Be(-1);
    }

    [Fact]
    public async Task LogFeedbackRecordedAsync_writes_FindingFeedbackRecorded_event()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid runId = Guid.NewGuid();
        Mock<IAuditService> audit = new();

        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        FindingInstrumentationAuditSupport sut = new(audit.Object, NullLogger<FindingInstrumentationAuditSupport>.Instance);

        await sut.LogFeedbackRecordedAsync(
            scope,
            "reviewer@test",
            runId,
            "abc123",
            1,
            FindingClassification.DecisionGradeFinding,
            "hidden",
            CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.FindingFeedbackRecorded
                    && e.RunId == runId
                    && e.TenantId == scope.TenantId
                    && e.DataJson.Contains("commentOmitted", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task LogAskConversationPersistedAsync_writes_FindingAskConversationPersisted_event()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid runId = Guid.NewGuid();
        Guid threadId = Guid.NewGuid();
        Mock<IAuditService> audit = new();

        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        FindingInstrumentationAuditSupport sut = new(audit.Object, NullLogger<FindingInstrumentationAuditSupport>.Instance);

        await sut.LogAskConversationPersistedAsync(
            scope,
            "reviewer@test",
            "finding-xyz",
            runId,
            threadId,
            CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.FindingAskConversationPersisted
                    && e.RunId == runId
                    && e.DataJson.Contains("conversationPersisted", StringComparison.Ordinal)
                    && e.DataJson.Contains(threadId.ToString(), StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task LogFeedbackRecordedAsync_when_audit_fails_throws_DurableAuditWriteFailedException()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("sql down"));

        FindingInstrumentationAuditSupport sut = new(audit.Object, NullLogger<FindingInstrumentationAuditSupport>.Instance);

        Func<Task> act = () => sut.LogFeedbackRecordedAsync(
            scope,
            "reviewer@test",
            Guid.NewGuid(),
            "abc123",
            1,
            null,
            null,
            CancellationToken.None);

        await act.Should().ThrowAsync<DurableAuditWriteFailedException>();
    }
}
