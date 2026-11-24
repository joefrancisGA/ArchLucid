using ArchLucid.Api.Security;
using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DurableAuthorizationAuditTests
{
    [Fact]
    public async Task Missing_database_configuration_fails_closed()
    {
        ICentralAuthorizationAudit audit = new UnavailableCentralAuthorizationAudit();
        CentralAuthorizationAuditRecord record = new(
            Guid.NewGuid(), "evidence.read", Guid.NewGuid(), Guid.NewGuid(),
            Guid.NewGuid(), Guid.NewGuid(), true, "authorized",
            "authenticated-principal", DateTimeOffset.UtcNow);

        Func<Task> write = () => audit.WriteAsync(record, CancellationToken.None);
        await write.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public void Audit_record_preserves_resource_scope_and_decision_id()
    {
        Guid decision = Guid.NewGuid();
        Guid tenant = Guid.NewGuid(), workspace = Guid.NewGuid(),
            project = Guid.NewGuid(), resource = Guid.NewGuid();
        DateTimeOffset occurred = DateTimeOffset.UnixEpoch;
        CentralAuthorizationAuditRecord record = new(
            decision, "remediation.plan", tenant, workspace, project,
            resource, false, "remediation_approval_missing",
            "authenticated-principal", occurred);
        record.DecisionId.Should().Be(decision);
        record.TenantId.Should().Be(tenant);
        record.WorkspaceId.Should().Be(workspace);
        record.ProjectId.Should().Be(project);
        record.ResourceId.Should().Be(resource);
        record.Action.Should().Be("remediation.plan");
        record.Reason.Should().Be("remediation_approval_missing");
        record.CallerKind.Should().Be("authenticated-principal");
        record.OccurredUtc.Should().Be(occurred);
        record.Allowed.Should().BeFalse();
    }
}
