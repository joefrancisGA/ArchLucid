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
    public void EnsureQueryableScope_throws_when_tenant_scope_missing()
    {
        RetrievalQuery query = BaseQuery(includePlatform: false);
        query.TenantId = Guid.Empty;

        Action act = () => AzureSearchTenantScopeFilterBuilder.EnsureQueryableScope(query);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*tenant scope*");
    }

    [Fact]
    public void BuildRequiredScopeFilter_includes_tenant_workspace_project()
    {
        RetrievalQuery query = BaseQuery(includePlatform: false);

        string filter = AzureSearchTenantScopeFilterBuilder.BuildRequiredScopeFilter(query);

        filter.Should().Contain($"tenantId eq '{TenantId:D}'");
        filter.Should().Contain($"workspaceId eq '{WorkspaceId:D}'");
        filter.Should().Contain($"projectId eq '{ProjectId:D}'");
    }

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
    public void BuildScopeFilter_emits_exact_assigned_policy_pack_id_for_odata_equality()
    {
        RetrievalQuery query = BaseQuery(includePlatform: true);
        query.AllowedPolicyPackRulePackIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Pack-A" };

        string filter = AzureSearchTenantScopeFilterBuilder.BuildScopeFilter(query);

        filter.Should().Contain("policyPackRulePackId eq 'Pack-A'");
    }

    [Fact]
    public void BuildScopeFilter_with_assigned_policy_packs_requires_platform_sentinel_tenant_id()
    {
        RetrievalQuery query = BaseQuery(includePlatform: true);
        query.AllowedPolicyPackRulePackIds = ["pack-a"];

        string filter = AzureSearchTenantScopeFilterBuilder.BuildScopeFilter(query);

        filter.Should().Contain(
            $"tenantId eq '{CorpusKindSentinels.PlatformSentinelTenantId:D}' and ((corpusKind ne 'PolicyPack') or (corpusKind eq 'PolicyPack'");
        filter.Should().NotContain(
            $"(tenantId eq '{CorpusKindSentinels.PlatformSentinelTenantId:D}' and corpusKind ne 'PolicyPack') or (corpusKind eq 'PolicyPack'");
    }

    [Fact]
    public void BuildScopeFilter_without_platform_corpora_excludes_platform_sentinel()
    {
        RetrievalQuery query = BaseQuery(includePlatform: false);

        string filter = AzureSearchTenantScopeFilterBuilder.BuildScopeFilter(query);

        filter.Should().NotContain(CorpusKindSentinels.PlatformSentinelTenantId.ToString("D"));
    }

    [Fact]
    public void BuildScopeFilter_includes_run_id_when_query_specifies_run_id()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        RetrievalQuery query = BaseQuery(includePlatform: false);
        query.RunId = runId;

        string filter = AzureSearchTenantScopeFilterBuilder.BuildScopeFilter(query);

        filter.Should().Contain($"runId eq '{runId:D}'");
    }

    [Fact]
    public void Authorized_evidence_runs_intersect_scope_and_existing_facets()
    {
        Guid run = Guid.NewGuid();
        Guid denied = Guid.NewGuid();
        RetrievalQuery query = BaseQuery(includePlatform: false);
        query.AuthorizedEvidenceRunIds = new HashSet<Guid> { run };
        query.ManifestId = Guid.NewGuid();
        query.RunId = run;

        string filter = AzureSearchTenantScopeFilterBuilder.BuildRequiredScopeFilter(query);

        filter.Should().Contain($"runId eq '{run:D}'");
        filter.Should().Contain($"search.in(runId, '{run:D}', ',')");
        filter.Should().Contain($"manifestId eq '{query.ManifestId:D}'");
        filter.Should().Contain("corpusKind eq 'TenantManifest'");
        filter.Should().Contain("corpusKind eq 'PriorManifest'");
        filter.Should().Contain("corpusKind eq 'KnowledgeGraphNode'");
        filter.Should().NotContain(denied.ToString("D"));
        filter.Should().NotContain("Conversation");
    }

    [Fact]
    public void Empty_authorized_evidence_set_is_not_unrestricted()
    {
        RetrievalQuery query = BaseQuery(includePlatform: false);
        query.AuthorizedEvidenceRunIds = new HashSet<Guid>();

        AzureSearchTenantScopeFilterBuilder.BuildRequiredScopeFilter(query).Should().Contain(" and false");
    }

    [Fact]
    public void Authorized_ask_platform_filter_excludes_unproven_sentinel_corpora()
    {
        RetrievalQuery query = BaseQuery(includePlatform: true);
        query.AuthorizedEvidenceRunIds = new HashSet<Guid>();
        query.AllowedPolicyPackRulePackIds = ["pack-a"];

        string filter = AzureSearchTenantScopeFilterBuilder.BuildRequiredScopeFilter(query);

        filter.Should().Contain("and false");
        filter.Should().Contain("corpusKind eq 'PlatformDoc'");
        filter.Should().Contain("corpusKind eq 'ReferenceArchitecture'");
        filter.Should().Contain("corpusKind eq 'AzureRetailPrice'");
        filter.Should().Contain("policyPackRulePackId eq 'pack-a'");
        filter.Should().NotContain("corpusKind eq 'Conversation'");
    }

    [Theory]
    [InlineData(CorpusKind.PolicyPack)]
    [InlineData(CorpusKind.AzureRetailPrice)]
    public void Platform_tool_corpus_filter_applies_after_the_scope_union(CorpusKind kind)
    {
        RetrievalQuery query = BaseQuery(includePlatform: true);
        query.AuthorizedEvidenceRunIds = new HashSet<Guid>();
        query.AllowedPolicyPackRulePackIds = ["pack-a"];
        query.CorpusKindFilter = kind;

        string filter = AzureSearchTenantScopeFilterBuilder.BuildRequiredScopeFilter(query);

        filter.Should().StartWith("(").And.EndWith($") and corpusKind eq '{kind}'");
        filter.Should().Contain("and false");
        filter.Should().Contain("policyPackRulePackId eq 'pack-a'");
    }

    [Fact]
    public void Prior_decision_corpus_filter_intersects_authorized_tenant_run()
    {
        Guid runId = Guid.NewGuid();
        RetrievalQuery query = BaseQuery(includePlatform: false);
        query.AuthorizedEvidenceRunIds = new HashSet<Guid> { runId };
        query.CorpusKindFilter = CorpusKind.PriorManifest;

        string filter = AzureSearchTenantScopeFilterBuilder.BuildRequiredScopeFilter(query);

        filter.Should().Contain($"search.in(runId, '{runId:D}', ',')");
        filter.Should().EndWith(") and corpusKind eq 'PriorManifest'");
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
