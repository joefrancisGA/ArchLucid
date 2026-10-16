using System.Text.Json;

using ArchLucid.Application.Governance.Workflow.Stages;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernanceWorkflowAuditSupportTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public void CreateGovernanceManifestPromotedAuditEvent_sets_explicit_actor_for_stable_promoted_by()
    {
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        GovernanceWorkflowAuditSupport support = CreateSupport();
        GovernancePromotionRecord record = new()
        {
            PromotionRecordId = "prom-1",
            RunId = "44444444-4444-4444-4444-444444444444",
            ManifestVersion = "1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
        };

        AuditEvent auditEvent = support.CreateGovernanceManifestPromotedAuditEvent(record, displayName, actorKey);

        auditEvent.ExplicitActor.Should().BeTrue();
        auditEvent.ActorUserId.Should().Be(actorKey);
        auditEvent.ActorUserName.Should().Be(displayName);
    }

    [Fact]
    public void CreateGovernanceManifestPromotedAuditEvent_includes_promoted_by_actor_key_in_data_json()
    {
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        GovernanceWorkflowAuditSupport support = CreateSupport();
        GovernancePromotionRecord record = new()
        {
            PromotionRecordId = "prom-1",
            RunId = "44444444-4444-4444-4444-444444444444",
            ManifestVersion = "1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
        };

        AuditEvent auditEvent = support.CreateGovernanceManifestPromotedAuditEvent(record, displayName, actorKey);

        using JsonDocument document = JsonDocument.Parse(auditEvent.DataJson);
        document.RootElement.GetProperty("promotedBy").GetString().Should().Be(displayName);
        document.RootElement.GetProperty("promotedByActorKey").GetString().Should().Be(actorKey);
    }

    [Fact]
    public void CreateGovernanceManifestPromotedAuditEvent_sets_run_id_on_audit_event()
    {
        const string runId = "44444444-4444-4444-4444-444444444444";
        GovernanceWorkflowAuditSupport support = CreateSupport();
        GovernancePromotionRecord record = new()
        {
            PromotionRecordId = "prom-1",
            RunId = runId,
            ManifestVersion = "1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
        };

        AuditEvent auditEvent = support.CreateGovernanceManifestPromotedAuditEvent(
            record,
            "Pat Operator",
            "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        auditEvent.RunId.Should().Be(Guid.Parse(runId));
    }

    [Fact]
    public void CreateGovernanceEnvironmentActivatedAuditEvent_sets_run_id_on_audit_event()
    {
        const string runId = "55555555-5555-5555-5555-555555555555";
        GovernanceWorkflowAuditSupport support = CreateSupport();
        GovernanceEnvironmentActivation activation = new()
        {
            ActivationId = "act-1",
            RunId = runId,
            ManifestVersion = "1",
            Environment = "test",
        };

        AuditEvent auditEvent = support.CreateGovernanceEnvironmentActivatedAuditEvent(
            activation,
            "Pat Operator",
            "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        auditEvent.RunId.Should().Be(Guid.Parse(runId));
    }

    [Fact]
    public void CreateGovernanceEnvironmentActivatedAuditEvent_sets_explicit_actor_for_stable_activated_by()
    {
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        GovernanceWorkflowAuditSupport support = CreateSupport();
        GovernanceEnvironmentActivation activation = new()
        {
            ActivationId = "act-1",
            RunId = "55555555-5555-5555-5555-555555555555",
            ManifestVersion = "1",
            Environment = "test",
        };

        AuditEvent auditEvent = support.CreateGovernanceEnvironmentActivatedAuditEvent(activation, displayName, actorKey);

        auditEvent.ExplicitActor.Should().BeTrue();
        auditEvent.ActorUserId.Should().Be(actorKey);
        auditEvent.ActorUserName.Should().Be(displayName);
    }

    [Fact]
    public void CreateGovernanceApprovalSubmittedAuditEvent_sets_run_id_on_audit_event()
    {
        const string runId = "77777777-7777-7777-7777-777777777777";
        GovernanceWorkflowAuditSupport support = CreateSupport();
        GovernanceApprovalRequest request = new()
        {
            ApprovalRequestId = "apr-2",
            RunId = runId,
            ManifestVersion = "1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
            RequestedBy = "Pat Operator",
            RequestedByActorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        };

        AuditEvent auditEvent = support.CreateGovernanceApprovalSubmittedAuditEvent(request, "Pat Operator");

        auditEvent.RunId.Should().Be(Guid.Parse(runId));
    }

    [Fact]
    public void CreateGovernanceApprovalSubmittedAuditEvent_sets_explicit_actor_for_stable_requested_by_actor_key()
    {
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        GovernanceWorkflowAuditSupport support = CreateSupport();
        GovernanceApprovalRequest request = new()
        {
            ApprovalRequestId = "apr-2",
            RunId = "77777777-7777-7777-7777-777777777777",
            ManifestVersion = "1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
            RequestedBy = displayName,
            RequestedByActorKey = actorKey,
        };

        AuditEvent auditEvent = support.CreateGovernanceApprovalSubmittedAuditEvent(request, displayName);

        auditEvent.ExplicitActor.Should().BeTrue();
        auditEvent.ActorUserId.Should().Be(actorKey);
        auditEvent.ActorUserName.Should().Be(displayName);
    }

    [Fact]
    public void CreateGovernanceApprovalSubmittedAuditEvent_includes_requested_by_actor_key_in_data_json()
    {
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        GovernanceWorkflowAuditSupport support = CreateSupport();
        GovernanceApprovalRequest request = new()
        {
            ApprovalRequestId = "apr-2",
            RunId = "77777777-7777-7777-7777-777777777777",
            ManifestVersion = "1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
            RequestedBy = displayName,
            RequestedByActorKey = actorKey,
        };

        AuditEvent auditEvent = support.CreateGovernanceApprovalSubmittedAuditEvent(request, displayName);

        using JsonDocument document = JsonDocument.Parse(auditEvent.DataJson);
        document.RootElement.GetProperty("requestedBy").GetString().Should().Be(displayName);
        document.RootElement.GetProperty("requestedByActorKey").GetString().Should().Be(actorKey);
    }

    [Fact]
    public void BuildGovernanceReviewAuditEvent_sets_explicit_actor_for_stable_reviewed_by_actor_key()
    {
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        GovernanceWorkflowAuditSupport support = CreateSupport();
        GovernanceApprovalRequest request = new()
        {
            ApprovalRequestId = "apr-1",
            RunId = "66666666-6666-6666-6666-666666666666",
            ManifestVersion = "1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
        };

        AuditEvent auditEvent = support.BuildGovernanceReviewAuditEvent(
            request,
            AuditEventTypes.GovernanceApprovalApproved,
            displayName,
            actorKey,
            "approved for test");

        auditEvent.ExplicitActor.Should().BeTrue();
        auditEvent.ActorUserId.Should().Be(actorKey);
        auditEvent.ActorUserName.Should().Be(displayName);
    }

    [Fact]
    public void BuildGovernanceReviewAuditEvent_includes_manifest_version_and_environments_in_data_json()
    {
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        GovernanceWorkflowAuditSupport support = CreateSupport();
        GovernanceApprovalRequest request = new()
        {
            ApprovalRequestId = "apr-1",
            RunId = "66666666-6666-6666-6666-666666666666",
            ManifestVersion = "2",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
        };

        AuditEvent auditEvent = support.BuildGovernanceReviewAuditEvent(
            request,
            AuditEventTypes.GovernanceApprovalApproved,
            displayName,
            actorKey,
            "approved for test");

        using JsonDocument document = JsonDocument.Parse(auditEvent.DataJson);
        document.RootElement.GetProperty("manifestVersion").GetString().Should().Be("2");
        document.RootElement.GetProperty("sourceEnvironment").GetString().Should().Be("dev");
        document.RootElement.GetProperty("targetEnvironment").GetString().Should().Be("test");
    }

    [Fact]
    public void BuildGovernanceReviewAuditEvent_includes_reviewed_by_actor_key_in_data_json()
    {
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        GovernanceWorkflowAuditSupport support = CreateSupport();
        GovernanceApprovalRequest request = new()
        {
            ApprovalRequestId = "apr-1",
            RunId = "66666666-6666-6666-6666-666666666666",
            ManifestVersion = "1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
        };

        AuditEvent auditEvent = support.BuildGovernanceReviewAuditEvent(
            request,
            AuditEventTypes.GovernanceApprovalApproved,
            displayName,
            actorKey,
            "approved for test");

        using JsonDocument document = JsonDocument.Parse(auditEvent.DataJson);
        document.RootElement.GetProperty("reviewedBy").GetString().Should().Be(displayName);
        document.RootElement.GetProperty("reviewedByActorKey").GetString().Should().Be(actorKey);
    }

    [Fact]
    public async Task LogSelfApprovalBlockedAsync_includes_manifest_version_and_environments_in_data_json()
    {
        const string runId = "88888888-8888-8888-8888-888888888888";
        AuditEvent? captured = null;
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        GovernanceWorkflowAuditSupport support = CreateSupport(auditService.Object);
        GovernanceApprovalRequest request = new()
        {
            ApprovalRequestId = "apr-blocked",
            RunId = runId,
            ManifestVersion = "3",
            SourceEnvironment = "dev",
            TargetEnvironment = "prod",
            RequestedBy = "Submitter",
            RequestedByActorKey = "jwt:22222222-2222-2222-2222-222222222222:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        };

        await support.LogSelfApprovalBlockedAsync(
            request,
            "apr-blocked",
            "Pat Operator",
            "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            CancellationToken.None);

        captured.Should().NotBeNull();
        using JsonDocument document = JsonDocument.Parse(captured!.DataJson);
        document.RootElement.GetProperty("manifestVersion").GetString().Should().Be("3");
        document.RootElement.GetProperty("sourceEnvironment").GetString().Should().Be("dev");
        document.RootElement.GetProperty("targetEnvironment").GetString().Should().Be("prod");
    }

    [Fact]
    public async Task LogSelfApprovalBlockedAsync_includes_run_id_in_data_json()
    {
        const string runId = "88888888-8888-8888-8888-888888888888";
        AuditEvent? captured = null;
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        GovernanceWorkflowAuditSupport support = CreateSupport(auditService.Object);
        GovernanceApprovalRequest request = new()
        {
            ApprovalRequestId = "apr-blocked",
            RunId = runId,
            RequestedBy = "Submitter",
            RequestedByActorKey = "jwt:22222222-2222-2222-2222-222222222222:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        };

        await support.LogSelfApprovalBlockedAsync(
            request,
            "apr-blocked",
            "Pat Operator",
            "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            CancellationToken.None);

        captured.Should().NotBeNull();
        using JsonDocument document = JsonDocument.Parse(captured!.DataJson);
        document.RootElement.GetProperty("runId").GetString().Should().Be(runId);
    }

    [Fact]
    public async Task LogSelfApprovalBlockedAsync_sets_explicit_actor_for_stable_reviewer_actor_key()
    {
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        AuditEvent? captured = null;
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        GovernanceWorkflowAuditSupport support = CreateSupport(auditService.Object);
        GovernanceApprovalRequest request = new()
        {
            ApprovalRequestId = "apr-blocked",
            RunId = "88888888-8888-8888-8888-888888888888",
            RequestedBy = "Submitter",
            RequestedByActorKey = "jwt:22222222-2222-2222-2222-222222222222:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        };

        await support.LogSelfApprovalBlockedAsync(
            request,
            "apr-blocked",
            displayName,
            actorKey,
            CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.ExplicitActor.Should().BeTrue();
        captured.ActorUserId.Should().Be(actorKey);
        captured.ActorUserName.Should().Be(displayName);
    }

    [Fact]
    public async Task LogDryRunValidationAttemptedForApprovalRequestAsync_sets_explicit_actor_for_stable_requested_by_actor_key()
    {
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        AuditEvent? captured = null;
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        GovernanceWorkflowAuditSupport support = CreateSupport(auditService.Object);

        await support.LogDryRunValidationAttemptedForApprovalRequestAsync(
            displayName,
            actorKey,
            "99999999-9999-9999-9999-999999999999",
            "1",
            "dev",
            "test",
            CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.ExplicitActor.Should().BeTrue();
        captured.ActorUserId.Should().Be(actorKey);
        captured.ActorUserName.Should().Be(displayName);
    }

    [Fact]
    public async Task LogDryRunValidationAttemptedForPromotionAsync_sets_explicit_actor_for_stable_promoted_by()
    {
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        AuditEvent? captured = null;
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        GovernanceWorkflowAuditSupport support = CreateSupport(auditService.Object);

        await support.LogDryRunValidationAttemptedForPromotionAsync(
            displayName,
            actorKey,
            "44444444-4444-4444-4444-444444444444",
            "1",
            "dev",
            "test",
            null,
            CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.ExplicitActor.Should().BeTrue();
        captured.ActorUserId.Should().Be(actorKey);
        captured.ActorUserName.Should().Be(displayName);
    }

    [Fact]
    public async Task LogDryRunValidationAttemptedForPromotionAsync_includes_promoted_by_actor_key_in_data_json()
    {
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        AuditEvent? captured = null;
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        GovernanceWorkflowAuditSupport support = CreateSupport(auditService.Object);

        await support.LogDryRunValidationAttemptedForPromotionAsync(
            displayName,
            actorKey,
            "44444444-4444-4444-4444-444444444444",
            "1",
            "dev",
            "test",
            null,
            CancellationToken.None);

        captured.Should().NotBeNull();
        using JsonDocument document = JsonDocument.Parse(captured!.DataJson);
        document.RootElement.GetProperty("promotedBy").GetString().Should().Be(displayName);
        document.RootElement.GetProperty("promotedByActorKey").GetString().Should().Be(actorKey);
    }

    [Fact]
    public async Task LogDryRunValidationAttemptedForPromotionAsync_includes_run_id_in_data_json()
    {
        const string runId = "44444444-4444-4444-4444-444444444444";
        AuditEvent? captured = null;
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        GovernanceWorkflowAuditSupport support = CreateSupport(auditService.Object);

        await support.LogDryRunValidationAttemptedForPromotionAsync(
            "Pat Operator",
            "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            runId,
            "1",
            "dev",
            "test",
            null,
            CancellationToken.None);

        captured.Should().NotBeNull();
        using JsonDocument document = JsonDocument.Parse(captured!.DataJson);
        document.RootElement.GetProperty("runId").GetString().Should().Be(runId);
    }

    [Fact]
    public async Task LogDryRunValidationAttemptedForApprovalRequestAsync_includes_run_id_in_data_json()
    {
        const string runId = "99999999-9999-9999-9999-999999999999";
        AuditEvent? captured = null;
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        GovernanceWorkflowAuditSupport support = CreateSupport(auditService.Object);

        await support.LogDryRunValidationAttemptedForApprovalRequestAsync(
            "Pat Operator",
            "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            runId,
            "1",
            "dev",
            "test",
            CancellationToken.None);

        captured.Should().NotBeNull();
        using JsonDocument document = JsonDocument.Parse(captured!.DataJson);
        document.RootElement.GetProperty("runId").GetString().Should().Be(runId);
    }

    [Fact]
    public async Task LogDryRunValidationAttemptedForApprovalRequestAsync_includes_requested_by_actor_key_in_data_json()
    {
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        AuditEvent? captured = null;
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        GovernanceWorkflowAuditSupport support = CreateSupport(auditService.Object);

        await support.LogDryRunValidationAttemptedForApprovalRequestAsync(
            displayName,
            actorKey,
            "99999999-9999-9999-9999-999999999999",
            "1",
            "dev",
            "test",
            CancellationToken.None);

        captured.Should().NotBeNull();
        using JsonDocument document = JsonDocument.Parse(captured!.DataJson);
        document.RootElement.GetProperty("requestedBy").GetString().Should().Be(displayName);
        document.RootElement.GetProperty("requestedByActorKey").GetString().Should().Be(actorKey);
    }

    private static GovernanceWorkflowAuditSupport CreateSupport(IAuditService? auditService = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        return new GovernanceWorkflowAuditSupport(
            auditService ?? Mock.Of<IAuditService>(),
            scopeProvider.Object,
            NullLogger<GovernanceWorkflowAuditSupport>.Instance);
    }
}
