using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Tests;
[Trait("Category", "Unit")]

public sealed class HotPathCacheKeysTests
{
    [SkippableFact]
    public void Manifest_includes_scope_and_id()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
        };

        Guid manifestId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        string key = HotPathCacheKeys.Manifest(scope, manifestId);

        key.Should().Contain("11111111111111111111111111111111");
        key.Should().Contain("44444444444444444444444444444444");
        key.Should().StartWith("al:hot:hm:");
    }

    [SkippableFact]
    public void Run_uses_scope_project_id_column()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
        };

        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        string key = HotPathCacheKeys.Run(scope, runId);

        key.Should().StartWith("al:hot:run:");
        key.Should().Contain("cccccccccccccccccccccccccccccccc");
    }

    [SkippableFact]
    public void PolicyPack_key_is_stable()
    {
        Guid id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        HotPathCacheKeys.PolicyPack(id).Should().Be("al:hot:pp:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
    }

    [SkippableFact]
    public void CommittedArchitectureReviewFlag_includes_scope_and_revision()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

        string key = HotPathCacheKeys.CommittedArchitectureReviewFlag(scope, runListScopeRevision: 7);

        key.Should().StartWith("al:hot:committed-arch-review:");
        key.Should().EndWith(":r7");
        key.Should().Contain("33333333333333333333333333333333");
    }

    [SkippableFact]
    public void EffectivePolicyPackSet_includes_revision()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        string key = HotPathCacheKeys.EffectivePolicyPackSet(tenantId, workspaceId, projectId, 42);

        key.Should().StartWith("al:hot:epps:");
        key.Should().EndWith(":r42");
    }

    [SkippableFact]
    public void RunListByProjectFirstPage_includes_scope_revision()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
        };

        string key = HotPathCacheKeys.RunListByProjectFirstPage(scope, "default", 20, 99);

        key.Should().StartWith("al:hot:runlist:proj:");
        key.Should().Contain(":r99:");
        key.Should().EndWith(":default");
    }

    [SkippableFact]
    public void RunListRecentInScopeFirstPage_includes_scope_revision()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
        };

        string key = HotPathCacheKeys.RunListRecentInScopeFirstPage(scope, 50, 7);

        key.Should().Contain(":r7:");
        key.Should().EndWith(":50");
    }

    [SkippableFact]
    public void FindingsSnapshot_includes_scope_and_id()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
        };

        Guid snapshotId = Guid.Parse("55555555-5555-5555-5555-555555555555");

        string key = HotPathCacheKeys.FindingsSnapshot(scope, snapshotId);

        key.Should().StartWith("al:hot:fs:");
        key.Should().Contain("55555555555555555555555555555555");
    }

    [SkippableFact]
    public void Reference_data_keys_are_stable()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid packId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        HotPathCacheKeys.TenantById(tenantId).Should().Be("al:hot:tenant:11111111111111111111111111111111");
        HotPathCacheKeys.ScimUserByExternalId(tenantId, "sub-1")
            .Should().Be("al:hot:scim-ext:11111111111111111111111111111111:sub-1");
        HotPathCacheKeys.CustomRoleAssignmentsForUser(tenantId, userId, 9)
            .Should().EndWith(":r9");
        HotPathCacheKeys.PolicyPackVersion(packId, "1.2.3")
            .Should().Be("al:hot:ppv:33333333333333333333333333333333:1.2.3");
        HotPathCacheKeys.TenantSignInEmailDomainByNormalized("Example.COM")
            .Should().Be("al:hot:tsignin-dom:EXAMPLE.COM");
    }
}
