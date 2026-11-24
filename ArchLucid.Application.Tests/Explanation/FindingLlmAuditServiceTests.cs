using ArchLucid.Application.Explanation.Models;
using ArchLucid.Application.Explanation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Explanation;
[Trait("Category", "Unit")]

public sealed class FindingLlmAuditServiceTests
{
    private static readonly Guid RunGuid = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    private static readonly Guid SnapshotGuid = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");

    private static (Mock<IRunRepository> Runs, Mock<IFindingsSnapshotRepository> Snapshots) SetupRunWithFindings(
        params Finding[] findings)
    {
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), RunGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = RunGuid, FindingsSnapshotId = SnapshotGuid });

        Mock<IFindingsSnapshotRepository> snapshots = new();
        snapshots.Setup(s => s.GetByIdAsync(It.IsAny<ScopeContext>(), SnapshotGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingsSnapshot { Findings = [.. findings] });

        return (runs, snapshots);
    }

    [SkippableFact]
    public async Task BuildAsync_uses_SourceAgentExecutionTraceId_when_present()
    {
        Finding finding = new()
        {
            FindingId = "f1", EngineType = nameof(AgentType.Topology), Trace = new ExplainabilityTrace { SourceAgentExecutionTraceId = "abc123" },
        };

        AgentExecutionTrace trace = new()
        {
            TraceId = "abc123",
            RunId = RunGuid.ToString("N"),
            AgentType = AgentType.Topology,
            SystemPrompt = "sys",
            UserPrompt = "user@test.com",
            RawResponse = "ok",
        };

        (Mock<IRunRepository> runs, Mock<IFindingsSnapshotRepository> snapshots) = SetupRunWithFindings(finding);

        Mock<IAgentExecutionTraceRepository> traces = new();
        traces.Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), RunGuid.ToString("N"),
            It.IsAny<CancellationToken>())).ReturnsAsync(new[] { trace });

        Mock<IPromptRedactor> redactor = new();
        redactor.Setup(r => r.Redact(It.IsAny<string?>())).Returns((string? s) => new PromptRedactionOutcome(s ?? "", new Dictionary<string, int>()));

        FindingLlmAuditService sut = new(
            runs.Object,
            snapshots.Object,
            Mock.Of<IScopeContextProvider>(p => p.GetCurrentScope() == new ScopeContext()),
            traces.Object,
            redactor.Object);

        FindingLlmAuditResult? result =
            await sut.BuildAsync(RunGuid, "f1", CancellationToken.None);

        result.Should().NotBeNull();
        result.TraceId.Should().Be("abc123");
        result.UserPromptRedacted.Should().Be("user@test.com");
        traces.Verify(t => t.GetByTraceIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task BuildAsync_falls_back_to_first_matching_AgentType()
    {
        Finding finding = new() { FindingId = "f1", EngineType = nameof(AgentType.Cost), Trace = new ExplainabilityTrace(), };

        AgentExecutionTrace wrong = new()
        {
            TraceId = "w1",
            RunId = RunGuid.ToString("N"),
            AgentType = AgentType.Topology,
            SystemPrompt = "a",
            UserPrompt = "b",
            RawResponse = "c",
        };

        AgentExecutionTrace match = new()
        {
            TraceId = "m1",
            RunId = RunGuid.ToString("N"),
            AgentType = AgentType.Cost,
            SystemPrompt = "s",
            UserPrompt = "u",
            RawResponse = "r",
        };

        (Mock<IRunRepository> runs, Mock<IFindingsSnapshotRepository> snapshots) = SetupRunWithFindings(finding);

        Mock<IAgentExecutionTraceRepository> traces = new();
        traces.Setup(t => t.GetByRunIdAsync(It.IsAny<ScopeContext>(), RunGuid.ToString("N"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AgentExecutionTrace> { wrong, match });

        Mock<IPromptRedactor> redactor = new();
        redactor.Setup(r => r.Redact(It.IsAny<string?>())).Returns((string? s) => new PromptRedactionOutcome(s ?? "", new Dictionary<string, int>()));

        FindingLlmAuditService sut = new(
            runs.Object,
            snapshots.Object,
            Mock.Of<IScopeContextProvider>(p => p.GetCurrentScope() == new ScopeContext()),
            traces.Object,
            redactor.Object);

        FindingLlmAuditResult? result =
            await sut.BuildAsync(RunGuid, "f1", CancellationToken.None);

        result.Should().NotBeNull();
        result.TraceId.Should().Be("m1");
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Preferred_trace_from_another_run_is_never_redacted_or_returned(bool hasValidFallback)
    {
        Finding finding = new()
        {
            FindingId = "f1", EngineType = nameof(AgentType.Cost),
            Trace = new ExplainabilityTrace { SourceAgentExecutionTraceId = "foreign" },
        };
        var (runs, snapshots) = SetupRunWithFindings(finding);
        ScopeContext scope = new();
        Mock<IAgentExecutionTraceRepository> traces = new(MockBehavior.Strict);
        AgentExecutionTrace foreign = new()
        {
            TraceId = "foreign", RunId = Guid.NewGuid().ToString("N"), UserPrompt = "private foreign prompt",
            AgentType = AgentType.Cost,
        };
        AgentExecutionTrace valid = new()
        {
            TraceId = "valid", RunId = RunGuid.ToString("D"), UserPrompt = "authorized prompt",
            AgentType = AgentType.Cost,
        };
        traces.Setup(t => t.GetByRunIdAsync(scope, RunGuid.ToString("N"), CancellationToken.None))
            .ReturnsAsync(hasValidFallback ? new[] { foreign, valid } : new[] { foreign });
        Mock<IPromptRedactor> redactor = new();
        redactor.Setup(x => x.Redact(It.IsAny<string?>()))
            .Returns((string? value) => new PromptRedactionOutcome(value ?? "", new Dictionary<string, int>()));
        FindingLlmAuditService service = new(runs.Object, snapshots.Object,
            Mock.Of<IScopeContextProvider>(p => p.GetCurrentScope() == scope), traces.Object, redactor.Object);

        FindingLlmAuditResult? result = await service.BuildAsync(RunGuid, "f1", CancellationToken.None);

        if (hasValidFallback)
            result!.TraceId.Should().Be("valid");
        else
            result.Should().BeNull();
        redactor.Verify(x => x.Redact("private foreign prompt"), Times.Never);
        traces.Verify(t => t.GetByTraceIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CompareQuality_BuildAsync_falls_back_to_trace_when_stored_under_legacy_run_id_key()
    {
        string canonical = RunGuid.ToString("N");
        string legacyUpper = canonical.ToUpperInvariant();

        Finding finding = new()
        {
            FindingId = "f1",
            EngineType = nameof(AgentType.Cost),
            Trace = new ExplainabilityTrace(),
        };

        AgentExecutionTrace legacyKeyed = new()
        {
            TraceId = "trace-legacy-repo-key",
            RunId = legacyUpper,
            AgentType = AgentType.Cost,
            SystemPrompt = "s",
            UserPrompt = "u",
            RawResponse = "r",
        };

        (Mock<IRunRepository> runs, Mock<IFindingsSnapshotRepository> snapshots) = SetupRunWithFindings(finding);

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            WorkspaceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        };

        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(t => t.GetByRunIdAsync(scope, canonical, It.IsAny<CancellationToken>()))
            .ReturnsAsync([legacyKeyed]);
        traces
            .Setup(t => t.GetByRunIdAsync(
                scope,
                It.Is<string>(id => id != canonical),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IPromptRedactor> redactor = new();
        redactor
            .Setup(r => r.Redact(It.IsAny<string?>()))
            .Returns((string? s) => new PromptRedactionOutcome(s ?? "", new Dictionary<string, int>()));

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        FindingLlmAuditService sut = new(
            runs.Object,
            snapshots.Object,
            scopeProvider.Object,
            traces.Object,
            redactor.Object);

        FindingLlmAuditResult? result =
            await sut.BuildAsync(RunGuid, "f1", CancellationToken.None);

        result.Should().NotBeNull();
        result!.TraceId.Should().Be("trace-legacy-repo-key");
    }
}
