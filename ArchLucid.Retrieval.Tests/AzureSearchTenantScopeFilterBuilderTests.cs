using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class AzureSearchTenantScopeFilterBuilderTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [Fact]
    public void BuildScopeFilter_includes_tenant_workspace_project()
    {
        RetrievalQuery query = BaseQuery(includePlatform: false);

        string filter = AzureSearchTenantScopeFilterBuilder.BuildScopeFilter(query);

        filter.Should().Contain($"tenantId eq '{TenantId:D}'");
        filter.Should().Contain($"workspaceId eq '{WorkspaceId:D}'");
        filter.Should().Contain($"projectId eq '{ProjectId:D}'");
    }

    [Fact]
    public void BuildScopeFilter_with_null_assigned_policy_packs_excludes_policy_pack_corpus()
    {
        RetrievalQuery query = BaseQuery(includePlatform: true);
        query.AllowedPolicyPackRulePackIds = null;

        string filter = AzureSearchTenantScopeFilterBuilder.BuildScopeFilter(query);

        filter.Should().Contain("corpusKind ne 'PolicyPack'");
        filter.Should().NotContain("policyPackRulePackId eq");
    }

    [Fact]
    public void BuildScopeFilter_with_platform_corpora_includes_platform_sentinel()
    {
        RetrievalQuery query = BaseQuery(includePlatform: true);
        query.AllowedPolicyPackRulePackIds = ["pack-a"];

        string filter = AzureSearchTenantScopeFilterBuilder.BuildScopeFilter(query);

        filter.Should().Contain(CorpusKindSentinels.PlatformSentinelTenantId.ToString("D"));
        filter.Should().Contain("policyPackRulePackId eq 'pack-a'");
    }

    [Fact]
    public void BuildScopeFilter_without_platform_corpora_excludes_platform_sentinel()
    {
        RetrievalQuery query = BaseQuery(includePlatform: false);

        string filter = AzureSearchTenantScopeFilterBuilder.BuildScopeFilter(query);

        filter.Should().NotContain(CorpusKindSentinels.PlatformSentinelTenantId.ToString("D"));
    }

    private static RetrievalQuery BaseQuery(bool includePlatform) => new()
    {
        TenantId = TenantId,
        WorkspaceId = WorkspaceId,
        ProjectId = ProjectId,
        QueryText = "q",
        TopK = 5,
        IncludePlatformCorpora = includePlatform,
    };
}
