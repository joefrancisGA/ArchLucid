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

        AuditEvent auditEvent = support.CreateGovernanceManifestPromotedAuditEvent(record, actorKey);

        auditEvent.ExplicitActor.Should().BeTrue();
        auditEvent.ActorUserId.Should().Be(actorKey);
        auditEvent.ActorUserName.Should().Be(actorKey);
    }

    [Fact]
    public void CreateGovernanceEnvironmentActivatedAuditEvent_sets_explicit_actor_for_stable_activated_by()
    {
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        GovernanceWorkflowAuditSupport support = CreateSupport();
        GovernanceEnvironmentActivation activation = new()
        {
            ActivationId = "act-1",
            RunId = "55555555-5555-5555-5555-555555555555",
            ManifestVersion = "1",
            Environment = "test",
        };

        AuditEvent auditEvent = support.CreateGovernanceEnvironmentActivatedAuditEvent(activation, actorKey);

        auditEvent.ExplicitActor.Should().BeTrue();
        auditEvent.ActorUserId.Should().Be(actorKey);
        auditEvent.ActorUserName.Should().Be(actorKey);
    }

    private static GovernanceWorkflowAuditSupport CreateSupport()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        return new GovernanceWorkflowAuditSupport(
            Mock.Of<IAuditService>(),
            scopeProvider.Object,
            NullLogger<GovernanceWorkflowAuditSupport>.Instance);
    }
}
