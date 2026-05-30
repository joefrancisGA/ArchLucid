using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.Pricing;

namespace ArchLucid.AgentRuntime;

/// <summary>Maps Azure Retail price rows into bounded grounding traces for the Cost agent (RAG-V1-006).</summary>
public static class RetailPriceRetrievalGroundingTraceMapper
{
    public const string CostAgentName = "Cost";

    public const string AzureRetailCorpusKind = "AzureRetailPricing";

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
                ChunkId = $"retail-{row.ServiceName}-{row.Sku}-{index}",
                DocumentId = row.ServiceName,
                CorpusKind = AzureRetailCorpusKind,
                Score = 1d,
            })
            .ToList();

        return RetrievalGroundingTraceBuilder.Build(scope, runId, CostAgentName, query, hits);
    }

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
