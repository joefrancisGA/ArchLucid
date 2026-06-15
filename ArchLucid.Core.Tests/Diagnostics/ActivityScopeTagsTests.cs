using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ActivityScopeTagsTests
{
    [Fact]
    public void ApplyTenantWorkspace_sets_tags_for_non_empty_guids()
    {
        using Activity activity = new("test");

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId };

        ActivityScopeTags.ApplyTenantWorkspace(activity, scope);

        activity.GetTagItem(ActivityScopeTags.TenantIdTag).Should().Be(tenantId.ToString("D"));
        activity.GetTagItem(ActivityScopeTags.WorkspaceIdTag).Should().Be(workspaceId.ToString("D"));
    }

    [Fact]
    public void ApplyTenantWorkspace_omits_empty_guids()
    {
        using Activity activity = new("test");

        ScopeContext scope = new() { TenantId = Guid.Empty, WorkspaceId = Guid.Empty };

        ActivityScopeTags.ApplyTenantWorkspace(activity, scope);

        activity.GetTagItem(ActivityScopeTags.TenantIdTag).Should().BeNull();
        activity.GetTagItem(ActivityScopeTags.WorkspaceIdTag).Should().BeNull();
    }

    [Fact]
    public void ApplyEvidencePackageId_sets_tag_when_guid_present()
    {
        using Activity activity = new("test");
        Guid packageId = Guid.NewGuid();

        ActivityScopeTags.ApplyEvidencePackageId(activity, packageId);

        activity.GetTagItem(ActivityScopeTags.EvidencePackageIdTag).Should().Be(packageId.ToString("D"));
    }
}
