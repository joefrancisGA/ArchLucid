using ArchLucid.Contracts.Architecture;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs.Enrichment;

public sealed class RunDetailEnrichmentContext
{
    public required RunDetailDto Detail { get; init; }

    public string? HostAgentExecutionMode { get; init; }

    public bool FailSoft { get; init; }

    public ArchitectureRunDetail? ArchitectureDetail { get; set; }

    public bool StopFurtherSlices { get; set; }
}

public interface IRunDetailEnrichmentSlice
{
    Task EnrichAsync(RunDetailEnrichmentContext context, CancellationToken cancellationToken);
}

public interface IAuthorityRunDetailEnrichmentComposer
{
    Task EnrichOperatorAsync(RunDetailDto detail, string? hostAgentExecutionMode, CancellationToken cancellationToken = default);

    Task EnrichBuyerSummaryAsync(RunDetailDto detail, string? hostAgentExecutionMode, CancellationToken cancellationToken = default);
}
