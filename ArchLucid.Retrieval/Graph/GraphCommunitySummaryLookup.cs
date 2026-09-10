using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Graph;

/// <inheritdoc cref="IGraphCommunitySummaryLookup" />
public sealed class GraphCommunitySummaryLookup(
    IGraphCommunitySummarizationService communitySummarizationService,
    IOptionsMonitor<AdvancedRetrievalOptions> advancedOptions) : IGraphCommunitySummaryLookup
{
    private readonly IGraphCommunitySummarizationService _communitySummarizationService =
        communitySummarizationService ?? throw new ArgumentNullException(nameof(communitySummarizationService));

    private readonly IOptionsMonitor<AdvancedRetrievalOptions> _advancedOptions =
        advancedOptions ?? throw new ArgumentNullException(nameof(advancedOptions));

    public async Task<IReadOnlyList<InsightGeneratorCommunitySummary>> GetSummariesAsync(
        GraphSnapshot graphSnapshot,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        AdvancedRetrievalOptions options = _advancedOptions.CurrentValue;

        if (!options.Enabled || !options.EnableCommunitySummarization)
            return [];

        IReadOnlyList<GraphCommunitySummary> summaries = await _communitySummarizationService
            .BuildBoundedSummariesAsync(graphSnapshot, cancellationToken)
            .ConfigureAwait(false);

        if (summaries.Count == 0)
            return [];

        List<InsightGeneratorCommunitySummary> bounded = [];

        foreach (GraphCommunitySummary summary in summaries.Take(InsightGeneratorCommunitySummaryLimits.MaxCommunities))
        {
            if (string.IsNullOrWhiteSpace(summary.CommunityId) || string.IsNullOrWhiteSpace(summary.Summary))
                continue;

            bounded.Add(new InsightGeneratorCommunitySummary
            {
                CommunityId = summary.CommunityId.Trim(),
                Summary = TruncateSummary(summary.Summary),
            });
        }

        return bounded;
    }

    private static string TruncateSummary(string summary)
    {
        string trimmed = summary.Trim();

        if (trimmed.Length <= InsightGeneratorCommunitySummaryLimits.MaxSummaryCharacters)
            return trimmed;

        return trimmed[..InsightGeneratorCommunitySummaryLimits.MaxSummaryCharacters];
    }
}
