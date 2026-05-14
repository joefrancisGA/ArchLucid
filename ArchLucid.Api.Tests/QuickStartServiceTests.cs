using ArchLucid.Api.Demo;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Demo;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

using Xunit;

namespace ArchLucid.Api.Tests;

/// <summary>Moq-backed unit coverage for marketing quick-start orchestration (<see cref="QuickStartService" />).</summary>
[Trait("Suite", "Core")]
public sealed class QuickStartServiceTests
{
    private static ScopeContext DemoScopePinned => DemoScopes.BuildDemoScope();

    [Fact]
    public async Task RunAsync_null_request_throws()
    {
        QuickStartService sut = QuickStartWithDisconnectedOrchestration();

        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            sut.RunAsync(null!, CancellationToken.None));
    }

    [Fact]
    public async Task RunAsync_unknown_preset_throws()
    {
        QuickStartService sut = QuickStartWithDisconnectedOrchestration();

        DemoQuickStartRequest inbound = new()
        {
            PresetId = "no-such-key",
            Description = "irrelevant",
        };

        InvalidOperationException ex =
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                sut.RunAsync(inbound, CancellationToken.None));

        Assert.Contains("unknown presetId", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task RunAsync_trimmed_preset_key_unknown_throws()
    {
        QuickStartService sut = QuickStartWithDisconnectedOrchestration();

        DemoQuickStartRequest inbound = new() { PresetId = "  unknown  " };

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.RunAsync(inbound, CancellationToken.None));
    }

    [Fact]
    public async Task RunAsync_requires_description_when_no_preset()
    {
        QuickStartService sut = QuickStartWithDisconnectedOrchestration();

        DemoQuickStartRequest inbound = new() { Description = "   \t\n" };

        InvalidOperationException ex =
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                sut.RunAsync(inbound, CancellationToken.None));

        Assert.Contains("required", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task RunAsync_free_text_normalizes_short_description_above_minimum()
    {
        string runId = Guid.NewGuid().ToString("N");

        ArchitectureRequest? capturedRequest = null;

        WiredMocks mocks = WireMocks(
            runId,
            EmptyExecute(runId),
            MinimalCommitted(runId, "mv"),
            rq => capturedRequest = rq);

        QuickStartService sut = ToService(mocks, publicSiteOrigin: "");

        await sut.RunAsync(new DemoQuickStartRequest { Description = "short" }, CancellationToken.None);

        Assert.NotNull(capturedRequest);

        Assert.Contains(
            "quick-start marketing summary.",
            capturedRequest!.Description,
            StringComparison.OrdinalIgnoreCase);

        VerifyPipelineOnce(runId, mocks);
    }

    [Fact]
    public async Task RunAsync_preset_and_notes_merge_description_lines_and_capabilities()
    {
        string runId = Guid.NewGuid().ToString("N");

        ArchitectureRequest? capturedRequest = null;

        WiredMocks mocks = WireMocks(
            runId,
            EmptyExecute(runId),
            MinimalCommitted(runId, "mv"),
            rq => capturedRequest = rq);

        QuickStartService sut = ToService(mocks);

        await sut.RunAsync(
            new DemoQuickStartRequest { PresetId = "microservices", Description = "  extra context  " },
            CancellationToken.None);

        Assert.NotNull(capturedRequest);

        Assert.True(QuickStartPresets.TryGet("microservices", out QuickStartPresets.PresetPayload? preset));

        Assert.NotNull(preset);
        Assert.Contains(preset!.ArchitectureDescription, capturedRequest!.Description, StringComparison.Ordinal);
        Assert.Contains("Additional notes: extra context", capturedRequest.Description, StringComparison.Ordinal);
        Assert.Contains("Regional HA", capturedRequest.RequiredCapabilities);
        Assert.Contains(
            "Demonstration-only analysis path",
            capturedRequest.RequiredCapabilities,
            StringComparer.OrdinalIgnoreCase);

        VerifyPipelineOnce(runId, mocks);
    }

    [Fact]
    public async Task RunAsync_preset_uses_preset_constraints_without_free_text_placeholder()
    {
        string runId = Guid.NewGuid().ToString("N");

        ArchitectureRequest? capturedRequest = null;

        WiredMocks mocks = WireMocks(
            runId,
            EmptyExecute(runId),
            MinimalCommitted(runId, "mv"),
            rq => capturedRequest = rq);

        QuickStartService sut = ToService(mocks);

        await sut.RunAsync(new DemoQuickStartRequest { PresetId = "event-driven" }, CancellationToken.None);

        Assert.NotNull(capturedRequest);

        Assert.DoesNotContain("Free-text marketing quick-start path inputs", capturedRequest!.Constraints);

        Assert.Contains(capturedRequest.Constraints, static x => x.StartsWith("scope=", StringComparison.Ordinal));

        VerifyPipelineOnce(runId, mocks);
    }

    [Fact]
    public async Task RunAsync_returns_ordered_top_findings_deep_link_manifest_and_writes_audits_when_run_id_hex()
    {
        string runHex = Guid.NewGuid().ToString("N");

        List<ArchitectureFinding> findingsOrdered =
        [
            CreateArchitectureFinding("top-critical", FindingSeverity.Critical),
            CreateArchitectureFinding("next-error", FindingSeverity.Error),
            CreateArchitectureFinding("third-warn", FindingSeverity.Warning),
            CreateArchitectureFinding(" \t ", FindingSeverity.Info, "cat-only"),
            CreateArchitectureFinding("tail-info", FindingSeverity.Info),
        ];

        ExecuteRunResult executed = ExecuteWithFindings(runHex, findingsOrdered);

        GoldenManifest golden = MinimalCommitted(runHex, "v7-app");

        List<AuditEvent> auditTrail = [];

        WiredMocks mocks = WireMocks(runHex, executed, golden, capture: null, auditTrail);

        Mock<IOptionsMonitor<PublicSiteOptions>> pub = PublicSiteFake("https://app.example/");
        QuickStartService sut =
            QuickStartLive(mocks.Create.Object, mocks.Execute.Object, mocks.Commit.Object, mocks.Audit.Object, pub.Object);

        DemoQuickStartResponse body =
            await sut.RunAsync(new DemoQuickStartRequest { PresetId = "monolith-migration" }, CancellationToken.None);

        Assert.Equal(runHex, body.RunId);
        Assert.Equal("v7-app", body.ManifestId);
        Assert.Equal(3, body.TopFindings.Count);
        Assert.Equal("top-critical", body.TopFindings[0].Title);
        Assert.Equal(nameof(FindingSeverity.Critical), body.TopFindings[0].Severity);
        Assert.Equal("next-error", body.TopFindings[1].Title);
        Assert.Equal("cat-only", body.TopFindings[2].Title);
        Assert.Equal($"https://app.example/runs/{Uri.EscapeDataString(runHex)}", body.RunDetailUrl);

        Guid expectedParsed = Guid.ParseExact(runHex, "N");

        Assert.Equal(2, auditTrail.Count);

        AuditEvent submitted = auditTrail.Single(static e => e.EventType == AuditEventTypes.RunSubmitted);

        AuditEvent completed = auditTrail.Single(static e => e.EventType == AuditEventTypes.RunCompleted);

        Assert.Equal(expectedParsed, submitted.RunId);
        Assert.Equal(DemoScopePinned.TenantId, submitted.TenantId);
        Assert.Equal(expectedParsed, completed.RunId);
        Assert.Contains("demo-quickstart", completed.DataJson, StringComparison.Ordinal);

        VerifyPipelineOnce(runHex, mocks);
    }

    [Fact]
    public async Task RunAsync_finding_summary_uses_fallback_title_when_message_and_category_blank()
    {
        string runHex = Guid.NewGuid().ToString("N");

        ExecuteRunResult executed = ExecuteWithFindings(
            runHex,
            [CreateArchitectureFinding(string.Empty, FindingSeverity.Critical, string.Empty)]);

        GoldenManifest golden = MinimalCommitted(runHex, "mv");

        List<AuditEvent> auditTrail = [];

        WiredMocks mocks = WireMocks(runHex, executed, golden, capture: null, auditTrail);

        QuickStartService sut = ToService(mocks);

        DemoQuickStartResponse body =
            await sut.RunAsync(new DemoQuickStartRequest { PresetId = "monolith-migration" }, CancellationToken.None);

        Assert.Single(body.TopFindings);
        Assert.Equal("Finding", body.TopFindings[0].Title);
    }

    [Fact]
    public async Task RunAsync_audit_writes_null_guid_when_run_identifier_is_not_parseable_guid()
    {
        string opaqueId = $"run-{Guid.NewGuid()}";

        List<AuditEvent> auditTrail = [];

        WiredMocks mocks = WireMocks(opaqueId, EmptyExecute(opaqueId), MinimalCommitted(opaqueId, "ver"), null, auditTrail);

        QuickStartService sut = ToService(mocks);

        await sut.RunAsync(
            new DemoQuickStartRequest { Description = new string('a', 11) }, CancellationToken.None);

        AuditEvent submitted = auditTrail.Single(static e => e.EventType == AuditEventTypes.RunSubmitted);

        Assert.Null(submitted.RunId);

        AuditEvent finished = auditTrail.Single(static e => e.EventType == AuditEventTypes.RunCompleted);

        Assert.Null(finished.RunId);

        VerifyPipelineOnce(opaqueId, mocks);
    }

    private sealed class WiredMocks
    {
        public WiredMocks(
            Mock<IArchitectureRunCreateOrchestrator> createMock,
            Mock<IArchitectureRunExecuteOrchestrator> executeMock,
            Mock<IArchitectureRunCommitOrchestrator> commitMock,
            Mock<IAuditService> auditMock)
        {
            Create = createMock;
            Execute = executeMock;
            Commit = commitMock;
            Audit = auditMock;
        }

        public Mock<IArchitectureRunCreateOrchestrator> Create
        {
            get;
        }

        public Mock<IArchitectureRunExecuteOrchestrator> Execute
        {
            get;
        }

        public Mock<IArchitectureRunCommitOrchestrator> Commit
        {
            get;
        }

        public Mock<IAuditService> Audit
        {
            get;
        }
    }

    private static void VerifyPipelineOnce(string runId, WiredMocks mocks)
    {
        mocks.Execute.Verify(e =>
            e.ExecuteRunAsync(runId, It.IsAny<CancellationToken>()), Times.Once());

        mocks.Commit.Verify(c =>
            c.CommitRunAsync(runId, It.IsAny<CancellationToken>()), Times.Once());

        mocks.Create.Verify(cr =>
            cr.CreateRunAsync(
                It.IsAny<ArchitectureRequest>(),
                null,
                It.IsAny<CancellationToken>()), Times.Once());
    }

    private static QuickStartService QuickStartWithDisconnectedOrchestration()
    {
        Mock<IArchitectureRunCreateOrchestrator> create = new(MockBehavior.Strict);
        Mock<IArchitectureRunExecuteOrchestrator> execute = new(MockBehavior.Strict);
        Mock<IArchitectureRunCommitOrchestrator> commit = new(MockBehavior.Strict);

        return QuickStartLive(
            create.Object,
            execute.Object,
            commit.Object,
            LooseAudit().Object,
            PublicSiteFake(string.Empty).Object);
    }

    private static QuickStartService ToService(WiredMocks mocks, string publicSiteOrigin = "")
    {
        return QuickStartLive(
            mocks.Create.Object,
            mocks.Execute.Object,
            mocks.Commit.Object,
            mocks.Audit.Object,
            PublicSiteFake(publicSiteOrigin).Object);
    }

    private static QuickStartService QuickStartLive(
        IArchitectureRunCreateOrchestrator create,
        IArchitectureRunExecuteOrchestrator execute,
        IArchitectureRunCommitOrchestrator commit,
        IAuditService auditService,
        IOptionsMonitor<PublicSiteOptions> publicSite)
    {
        Mock<IActorContext> actor = new();

        actor.Setup(static a => a.GetActor()).Returns("demo-quickstart-unit");

        Mock<IScopeContextProvider> scopes = new();

        scopes.Setup(static s => s.GetCurrentScope()).Returns(DemoScopePinned);

        return new QuickStartService(
            create,
            execute,
            commit,
            auditService,
            actor.Object,
            scopes.Object,
            publicSite,
            NullLogger<QuickStartService>.Instance);
    }

    private static Mock<IOptionsMonitor<PublicSiteOptions>> PublicSiteFake(string baseUrlValue)
    {
        Mock<IOptionsMonitor<PublicSiteOptions>> monitor = new();

        monitor.Setup(static m => m.CurrentValue).Returns(new PublicSiteOptions { BaseUrl = baseUrlValue });

        return monitor;
    }

    private static Mock<IAuditService> LooseAudit()
    {
        Mock<IAuditService> audits = new();

        _ = audits
            .Setup(static a =>
                a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return audits;
    }

    private static Mock<IAuditService> AuditsCapturingTrail(List<AuditEvent> bucket)
    {
        Mock<IAuditService> audits = new(MockBehavior.Strict);

        _ = audits
            .Setup(static a =>
                a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask)
            .Callback<AuditEvent, CancellationToken>((evt, _) => bucket.Add(evt));

        return audits;
    }

    private static WiredMocks WireMocks(
        string runIdReturned,
        ExecuteRunResult executed,
        GoldenManifest committed,
        Action<ArchitectureRequest>? capture,
        List<AuditEvent>? auditTrail = null)
    {
        Mock<IArchitectureRunCreateOrchestrator> create = new(MockBehavior.Strict);

        _ = create
            .Setup(cr =>
                cr.CreateRunAsync(
                    It.IsAny<ArchitectureRequest>(),
                    null,
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(NewCreateResult(runIdReturned))
            .Callback<ArchitectureRequest, CreateRunIdempotencyState?, CancellationToken>((rq, _, _) =>
                capture?.Invoke(rq));

        Mock<IArchitectureRunExecuteOrchestrator> execute = new(MockBehavior.Strict);

        _ = execute
            .Setup(e =>
                e.ExecuteRunAsync(runIdReturned, It.IsAny<CancellationToken>()))
            .ReturnsAsync(executed);

        Mock<IArchitectureRunCommitOrchestrator> commit = new(MockBehavior.Strict);

        _ = commit
            .Setup(c =>
                c.CommitRunAsync(runIdReturned, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CommitRunResult { Manifest = committed });

        Mock<IAuditService> audit = auditTrail is null ? LooseAudit() : AuditsCapturingTrail(auditTrail);

        return new WiredMocks(create, execute, commit, audit);
    }

    private static CreateRunResult NewCreateResult(string runId)
    {
        return new CreateRunResult
        {
            Run = new ArchitectureRun { RunId = runId },
        };
    }

    private static ExecuteRunResult EmptyExecute(string runId)
    {
        return new ExecuteRunResult { RunId = runId, Results = [] };
    }

    private static ExecuteRunResult ExecuteWithFindings(string runId, IReadOnlyList<ArchitectureFinding> findings)
    {
        AgentResult agent = new()
        {
            TaskId = "task",
            RunId = runId,
            AgentType = AgentType.Topology,
            Findings = [.. findings],
        };

        return new ExecuteRunResult { RunId = runId, Results = [agent] };
    }

    private static ArchitectureFinding CreateArchitectureFinding(
        string message,
        FindingSeverity severity,
        string? category = null)
    {
        return new ArchitectureFinding
        {
            Message = message,
            Severity = severity,
            Category = category ?? string.Empty,
        };
    }

    private static GoldenManifest MinimalCommitted(string runIdentifier, string manifestVersion)
    {
        return new GoldenManifest
        {
            RunId = runIdentifier,
            SystemName = "unit",
            Services = [],
            Datastores = [],
            Relationships = [],
            Governance = new ManifestGovernance(),
            Metadata =
                new ManifestMetadata
                {
                    ManifestVersion = manifestVersion,
                },
        };
    }
}
