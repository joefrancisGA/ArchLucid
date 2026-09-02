using ArchLucid.Application.Agents;
using ArchLucid.Application.Runs.Mapping;
using ArchLucid.Contracts.Runs;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs.Enrichment;

public sealed class RunDetailHeaderEnrichmentSlice : IRunDetailEnrichmentSlice
{
    public Task EnrichAsync(RunDetailEnrichmentContext context, CancellationToken cancellationToken)
    {
        RunDetailDto detail = context.Detail;
        detail.EngineProvenance = ReviewRunEngineProvenanceJson.TryDeserialize(detail.Run.EngineProvenanceJson);
        detail.LastAgentExecutionFailure =
            AgentExecutionFailureSummaryJson.TryDeserialize(detail.Run.LastFailureReason);
        detail.Run.IsDeadLettered = RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(detail.Run);
        return Task.CompletedTask;
    }
}
