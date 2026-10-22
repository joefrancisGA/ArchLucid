using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.Pricing;

namespace ArchLucid.AgentRuntime;

/// <summary>Maps structured retail-price rows into bounded grounding traces for the Cost agent (RAG-V1-006 / TB-603).</summary>
public static class RetailPriceRetrievalGroundingTraceMapper
{
    public const string CostAgentName = "Cost";

    public const string AzureRetailCorpusKind = "AzureRetailPricing";

    public const string AwsRetailCorpusKind = "AwsPublicPricing";

    public const string GcpRetailCorpusKind = "GcpBillingCatalog";

    public static RetrievalGroundingTraceInsert BuildInsert(
        ScopeContext scope,
        Guid runId,
        ArchitectureRequest request,
        CostRetailGroundingResult grounding)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(grounding);

        RetrievalQuery query = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            QueryText = Truncate(request.Description, RetrievalGroundingTraceBounds.MaxQueryTextLength) ?? "(cost retail lookup)",
            TopK = grounding.CitedRows.Count > 0 ? grounding.CitedRows.Count : 3,
        };

        List<RetrievalHit> hits = grounding.CitedRows
            .Select(static (row, index) => new RetrievalHit
            {
                ChunkId = $"retail-{row.CloudProvider}-{row.ServiceName}-{row.Sku}-{index}",
                DocumentId = row.ServiceName,
                CorpusKind = ResolveCorpusKind(row.CloudProvider),
                Score = 1d,
            })
            .ToList();

        return RetrievalGroundingTraceBuilder.Build(scope, runId, CostAgentName, query, hits);
    }

    internal static string ResolveCorpusKind(CloudProvider provider) =>
        provider switch
        {
            CloudProvider.Aws => AwsRetailCorpusKind,
            CloudProvider.Gcp => GcpRetailCorpusKind,
            CloudProvider.Azure => AzureRetailCorpusKind,
            _ => AzureRetailCorpusKind,
        };

    private static string? Truncate(string? text, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(text))
            return null;

        string trimmed = text.Trim();

        if (trimmed.Length <= maxLength)
            return trimmed;

        return trimmed[..maxLength];
    }
}
