using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs.Enrichment;

public sealed class AuthorityRunDetailEnrichmentComposer(
    RunDetailHeaderEnrichmentSlice headerSlice,
    RunDetailLlmCostEnrichmentSlice llmCostSlice,
    RunDetailEstimatedUsdSavingsEnrichmentSlice estimatedUsdSavingsSlice,
    RunDetailArchitectureResultsEnrichmentSlice architectureResultsSlice,
    RunDetailBuyerResultsEnrichmentSlice buyerResultsSlice,
    RunDetailRetrievalGroundingEnrichmentSlice retrievalGroundingSlice,
    RunDetailDecisionExplainabilityEnrichmentSlice decisionExplainabilitySlice,
    RunDetailTrustEvidenceEnrichmentSlice trustEvidenceSlice) : IAuthorityRunDetailEnrichmentComposer
{
    public async Task EnrichOperatorAsync(
        RunDetailDto detail,
        string? hostAgentExecutionMode,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(detail);

        RunDetailEnrichmentContext context = new()
        {
            Detail = detail,
            HostAgentExecutionMode = hostAgentExecutionMode,
            FailSoft = false,
        };

        await headerSlice.EnrichAsync(context, cancellationToken).ConfigureAwait(false);
        await llmCostSlice.EnrichAsync(context, cancellationToken).ConfigureAwait(false);
        await estimatedUsdSavingsSlice.EnrichAsync(context, cancellationToken).ConfigureAwait(false);
        await architectureResultsSlice.EnrichAsync(context, cancellationToken).ConfigureAwait(false);

        if (context.StopFurtherSlices || context.ArchitectureDetail is null)
            return;

        await retrievalGroundingSlice.EnrichAsync(context, cancellationToken).ConfigureAwait(false);
        await decisionExplainabilitySlice.EnrichAsync(context, cancellationToken).ConfigureAwait(false);

        if (!context.ArchitectureDetail.IsCommitted)
            return;

        await trustEvidenceSlice.EnrichAsync(context, cancellationToken).ConfigureAwait(false);
    }

    public async Task EnrichBuyerSummaryAsync(
        RunDetailDto detail,
        string? hostAgentExecutionMode,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(detail);

        RunDetailEnrichmentContext context = new()
        {
            Detail = detail,
            HostAgentExecutionMode = hostAgentExecutionMode,
            FailSoft = true,
        };

        await headerSlice.EnrichAsync(context, cancellationToken).ConfigureAwait(false);
        await InvokeFailSoftAsync(context, llmCostSlice, cancellationToken);
        await InvokeFailSoftAsync(context, estimatedUsdSavingsSlice, cancellationToken);
        await InvokeFailSoftAsync(context, buyerResultsSlice, cancellationToken);
        await InvokeFailSoftAsync(context, retrievalGroundingSlice, cancellationToken);
        await InvokeFailSoftAsync(context, decisionExplainabilitySlice, cancellationToken);

        if (detail.Run.GoldenManifestId.HasValue && detail.Run.GoldenManifestId.Value != Guid.Empty)
            await InvokeFailSoftAsync(context, trustEvidenceSlice, cancellationToken);

        detail.Results = [];
    }

    private static async Task InvokeFailSoftAsync(
        RunDetailEnrichmentContext context,
        IRunDetailEnrichmentSlice slice,
        CancellationToken cancellationToken)
    {
        try
        {
            await slice.EnrichAsync(context, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception) when (context.FailSoft)
        {
            // Buyer SSR must not 500 on optional enrichment faults.
        }
    }
}
