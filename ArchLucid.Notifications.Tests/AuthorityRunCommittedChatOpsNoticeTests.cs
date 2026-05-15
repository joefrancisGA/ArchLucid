using ArchLucid.Notifications;

using FluentAssertions;

namespace ArchLucid.Notifications.Tests;

[Trait("Category", "Unit")]
public sealed class AuthorityRunCommittedChatOpsNoticeTests
{
    [Fact]
    public void init_sets_all_fields()
    {
        Guid tenant = Guid.NewGuid();
        Guid workspace = Guid.NewGuid();
        Guid project = Guid.NewGuid();
        Guid run = Guid.NewGuid();

        AuthorityRunCommittedChatOpsNotice sut = new()
        {
            TenantId = tenant,
            WorkspaceId = workspace,
            ProjectId = project,
            RunId = run,
            FindingCount = 5,
            Description = "summary",
        };

        sut.TenantId.Should().Be(tenant);
        sut.WorkspaceId.Should().Be(workspace);
        sut.ProjectId.Should().Be(project);
        sut.RunId.Should().Be(run);
        sut.FindingCount.Should().Be(5);
        sut.Description.Should().Be("summary");
    }
}
