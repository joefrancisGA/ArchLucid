using System.Text.Json;

using ArchLucid.Application.Agents;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatch10Tests
{
    [Fact]
    public void QuickScanGuardContextFactory_builds_fingerprint_and_context()
    {
        QuickScanGuardContext context = QuickScanGuardContextFactory.Create(
            "203.0.113.10",
            "session-1",
            "  Design a resilient API  ");

        context.ClientIp.Should().Be("203.0.113.10");
        context.SessionId.Should().Be("session-1");
        context.PayloadFingerprint.Should().Be(
            QuickScanGuardContextFactory.ComputeFingerprint("  Design a resilient API  ", "session-1"));
        context.PayloadFingerprint.Should().HaveLength(64);
    }

    [Fact]
    public void QuickScanSampleResultProvider_builds_demonstration_payload_with_defaults_and_overrides()
    {
        ArchitectureQuickScanResponse defaults = QuickScanSampleResultProvider.Build();

        defaults.ScanId.Should().Be("sample-quick-scan");
        defaults.SystemName.Should().Be("Claims intake API");
        defaults.PrimaryEnvironment.Should().Be(QuickScanPrimaryEnvironment.Azure);
        defaults.IsSampleResult.Should().BeTrue();
        defaults.DemonstrationDisclaimer.Should().Be(QuickScanSampleResultProvider.DemonstrationDisclaimer);
        defaults.Findings.Should().HaveCount(3);
        defaults.PositiveObservations.Should().NotBeEmpty();
        defaults.RecommendedNextSteps.Should().NotBeEmpty();

        ArchitectureQuickScanResponse rescan = QuickScanSampleResultProvider.Build();
        rescan.SystemName.Should().Be(defaults.SystemName);
        rescan.PrimaryEnvironment.Should().Be(defaults.PrimaryEnvironment);
    }

    [Fact]
    public void QuickScanMinimalContextBuilder_builds_validated_file_payload()
    {
        QuickScanRequestValidator.ValidatedQuickScanRequest validated = new(
            SystemName: "Orders",
            PrimaryEnvironment: QuickScanPrimaryEnvironment.Azure,
            PrimaryEnvironmentOther: null,
            Description: "Need resilient messaging and private endpoints.",
            ArchitectureConcerns: ["security", "cost"]);

        Dictionary<string, string> files = QuickScanMinimalContextBuilder.BuildFiles(validated);

        files.Should().ContainKey("quick-scan-context.txt");
        files["quick-scan-context.txt"].Should().Contain("Orders");
        files["quick-scan-context.txt"].Should().Contain("security, cost");
        files["quick-scan-context.txt"].Should().Contain("Need resilient messaging");
    }

    [Fact]
    public void QuickScanMinimalContextBuilder_legacy_request_path_validates_before_building()
    {
        ArchitectureQuickScanRequest request = new()
        {
            SystemName = "Orders",
            PrimaryEnvironment = QuickScanPrimaryEnvironment.Azure,
            Description = "Need resilient messaging.",
        };

        Dictionary<string, string> files = QuickScanMinimalContextBuilder.BuildFiles(request);

        files.Should().ContainKey("quick-scan-context.txt");

        ArchitectureQuickScanRequest invalid = new() { SystemName = " ", Description = "x" };
        Action act = () => QuickScanMinimalContextBuilder.BuildFiles(invalid);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void DraftRequestDocumentCloner_round_trips_document_json()
    {
        DraftRequestDocument source = new()
        {
            FreeTextIntent = "Branch what-if",
            SystemName = "Payments",
            QuestionAnswers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["tier"] = "gold" },
        };

        DraftRequestDocument clone = DraftRequestDocumentCloner.Clone(source);

        clone.Should().NotBeSameAs(source);
        clone.FreeTextIntent.Should().Be(source.FreeTextIntent);
        clone.QuestionAnswers.Should().ContainKey("tier").WhoseValue.Should().Be("gold");

        Action nullDocument = () => DraftRequestDocumentCloner.Clone(null!);
        nullDocument.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public async Task ModelExecutionProfileOverrideAuditWriter_skips_when_override_not_requested()
    {
        Mock<IAuditService> auditService = new();
        Mock<IScopeContextProvider> scope = new();

        ModelExecutionProfileResolution resolution = new(
            AgentModelExecutionProfile.Balanced,
            AgentModelExecutionProfile.Balanced,
            RequestedOverrideRaw: null,
            OverrideRejected: false);

        await ModelExecutionProfileOverrideAuditWriter.TryLogOverrideAppliedAsync(
            auditService.Object,
            scope.Object,
            "run-1",
            resolution,
            CancellationToken.None);

        auditService.Verify(
            s => s.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ModelExecutionProfileOverrideAuditWriter_logs_override_with_scope_and_run_id()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(s => s.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        });

        ModelExecutionProfileResolution resolution = new(
            AgentModelExecutionProfile.HighAssurance,
            AgentModelExecutionProfile.Balanced,
            RequestedOverrideRaw: "high-assurance",
            OverrideRejected: true);

        await ModelExecutionProfileOverrideAuditWriter.TryLogOverrideAppliedAsync(
            auditService.Object,
            scope.Object,
            runId.ToString(),
            resolution,
            CancellationToken.None);

        AuditEvent captured = auditService.Invocations
            .Single(invocation => invocation.Method.Name == nameof(IAuditService.LogAsync))
            .Arguments[0]
            .Should()
            .BeOfType<AuditEvent>()
            .Subject;

        captured.EventType.Should().Be(AuditEventTypes.RunModelExecutionProfileOverrideApplied);
        captured.TenantId.Should().Be(tenantId);
        captured.WorkspaceId.Should().Be(workspaceId);
        captured.ProjectId.Should().Be(projectId);
        captured.RunId.Should().Be(runId);
        captured.DataJson.Should().Contain("high-assurance");
        captured.DataJson.Should().Contain("overrideRejected");
    }

    [Fact]
    public void QuickScanTelemetry_records_attempt_success_rejection_failure_and_sample_view()
    {
        QuickScanTelemetry sut = new(NullLogger<QuickScanTelemetry>.Instance);
        QuickScanGuardContext context = new()
        {
            ClientIp = "127.0.0.1",
            SessionId = "session-telemetry",
            PayloadFingerprint = "fp",
        };

        sut.Invoking(s => s.RecordAttempt(context)).Should().NotThrow();
        sut.Invoking(s => s.RecordSuccess(context, "scan-1", 0.12m, 100, 50, "gpt-test", TimeSpan.FromMilliseconds(250)))
            .Should()
            .NotThrow();
        sut.Invoking(s => s.RecordRejection(context, QuickScanGuardRejectionReason.Disabled)).Should().NotThrow();
        sut.Invoking(s => s.RecordFailure(context, "timeout", TimeSpan.FromSeconds(2))).Should().NotThrow();
        sut.Invoking(s => s.RecordSampleView(context, "sample_available")).Should().NotThrow();
    }
}
