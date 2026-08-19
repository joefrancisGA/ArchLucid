using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Scoping;

[Trait("Category", "Unit")]
public sealed class ScopeContextAuditExtensionsTests
{
    [Fact]
    public void CreateAuditEvent_maps_scope_ids_event_type_actor_and_data_json()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };

        AuditEvent audit = scope.CreateAuditEvent("test.event", "u1", "User One", """{"k":1}""");

        audit.EventType.Should().Be("test.event");
        audit.ActorUserId.Should().Be("u1");
        audit.ActorUserName.Should().Be("User One");
        audit.TenantId.Should().Be(tenantId);
        audit.WorkspaceId.Should().Be(workspaceId);
        audit.ProjectId.Should().Be(projectId);
        audit.DataJson.Should().Be("""{"k":1}""");
    }

    [Fact]
    public void CreateAuditEvent_with_null_data_json_uses_empty_object()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
        };

        AuditEvent audit = scope.CreateAuditEvent("x", "a", "b", null);

        audit.DataJson.Should().Be("{}");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateAuditEvent_with_blank_data_json_uses_empty_object(string? dataJson)
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            WorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            ProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff")
        };

        AuditEvent audit = scope.CreateAuditEvent("x", "a", "b", dataJson);

        audit.DataJson.Should().Be("{}");
    }

    [Fact]
    public void CreateAuditEvent_null_scope_throws()
    {
        ScopeContext? scope = null;
        Action act = () => scope!.CreateAuditEvent("x", "a", "b");

        act.Should().Throw<ArgumentNullException>().WithParameterName("scope");
    }
}
