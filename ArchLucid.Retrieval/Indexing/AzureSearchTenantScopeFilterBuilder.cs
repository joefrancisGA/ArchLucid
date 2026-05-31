using ArchLucid.Core.Retrieval;

using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>
///     Builds OData scope filters for Azure AI Search vector queries (TB-048 / RAG-V1-010 P1).
/// </summary>
public static class AzureSearchTenantScopeFilterBuilder
{
    /// <summary>
    ///     Validates that <paramref name="query" /> carries tenant/workspace/project scope before Azure AI Search dispatch.
    /// </summary>
    public static void EnsureQueryableScope(RetrievalQuery query)
    {
        ArgumentNullException.ThrowIfNull(query);

        if (query.TenantId == Guid.Empty)
            throw new InvalidOperationException("Azure AI Search queries require a non-empty tenant scope.");

        if (query.WorkspaceId == Guid.Empty)
            throw new InvalidOperationException("Azure AI Search queries require a non-empty workspace scope.");

        if (query.ProjectId == Guid.Empty)
            throw new InvalidOperationException("Azure AI Search queries require a non-empty project scope.");
    }

    /// <summary>Builds the OData filter after <see cref="EnsureQueryableScope" /> validation (TB-071).</summary>
    public static string BuildRequiredScopeFilter(RetrievalQuery query)
    {
        EnsureQueryableScope(query);

        return BuildScopeFilter(query);
    }

    /// <summary>
    ///     Returns a filter clause that scopes results to the tenant/workspace/project in
    ///     <paramref name="query" /> and excludes unassigned policy-pack corpora.
    /// </summary>
    public static string BuildScopeFilter(RetrievalQuery query)
    {
        ArgumentNullException.ThrowIfNull(query);

        List<string> clauses =
        [
            $"tenantId eq '{query.TenantId:D}'",
            $"workspaceId eq '{query.WorkspaceId:D}'",
            $"projectId eq '{query.ProjectId:D}'",
        ];

        if (query.RunId is Guid runId)
            clauses.Add($"runId eq '{runId:D}'");

        if (query.ManifestId is Guid manifestId)
            clauses.Add($"manifestId eq '{manifestId:D}'");

        if (query.IncludePlatformCorpora)
        {
            HashSet<string>? allowedPacks = query.AllowedPolicyPackRulePackIds;
            string platformScope =
                $"(tenantId eq '{CorpusKindSentinels.PlatformSentinelTenantId:D}' and corpusKind ne 'PolicyPack')";

            if (allowedPacks is not null && allowedPacks.Count > 0)
            {
                string packList = string.Join(
                    " or ",
                    allowedPacks.Select(static id => $"policyPackRulePackId eq '{EscapeODataString(id)}'"));

                platformScope =
                    $"((tenantId eq '{CorpusKindSentinels.PlatformSentinelTenantId:D}' and corpusKind ne 'PolicyPack') or (corpusKind eq 'PolicyPack' and ({packList})))";
            }
            else
            {
                platformScope =
                    $"(tenantId eq '{CorpusKindSentinels.PlatformSentinelTenantId:D}' and corpusKind ne 'PolicyPack')";
            }

            return $"(({string.Join(" and ", clauses)}) or {platformScope})";
        }

        return string.Join(" and ", clauses);
    }

    private static string EscapeODataString(string value) => value.Replace("'", "''", StringComparison.Ordinal);
}
