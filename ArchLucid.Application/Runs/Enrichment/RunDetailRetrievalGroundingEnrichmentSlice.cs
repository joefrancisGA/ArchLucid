using ArchLucid.Application.Runs.Mapping;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Application.Runs.Enrichment;

public sealed class RunDetailRetrievalGroundingEnrichmentSlice(
    IRetrievalGroundingTraceReader retrievalGroundingTraceReader,
    IConfiguration configuration) : IRunDetailEnrichmentSlice
{
    private readonly IRetrievalGroundingTraceReader _retrievalGroundingTraceReader =
        retrievalGroundingTraceReader ?? throw new ArgumentNullException(nameof(retrievalGroundingTraceReader));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    public async Task EnrichAsync(RunDetailEnrichmentContext context, CancellationToken cancellationToken)
    {
        RunDetailDto detail = context.Detail;
        RunRecord run = detail.Run;

        IReadOnlyList<RetrievalGroundingTraceRecord> traces =
            await _retrievalGroundingTraceReader
                .GetByRunIdAsync(
                    run.TenantId,
                    run.WorkspaceId,
                    run.ScopeProjectId,
                    run.RunId,
                    cancellationToken)
                .ConfigureAwait(false);

        detail.RetrievalGroundingSummary = RunRetrievalGroundingSummaryBuilder.Build(
            traces,
            detail.Results,
            GraphRagQualityPosture.ResolveForGroundedRun(
                _configuration,
                traces.Sum(static trace => trace.GraphRagNeighborsAdded ?? 0),
                traces.Sum(static trace => trace.GraphRagSeedHits ?? 0)));
    }
}
