using ArchLucid.Application.Runs.Enrichment;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs;

/// <inheritdoc cref="IAuthorityRunDetailOperatorEnricher" />
public sealed class AuthorityRunDetailOperatorEnricher(
    IAuthorityRunDetailEnrichmentComposer composer) : IAuthorityRunDetailOperatorEnricher
{
    private readonly IAuthorityRunDetailEnrichmentComposer _composer =
        composer ?? throw new ArgumentNullException(nameof(composer));

    /// <inheritdoc />
    public Task EnrichAsync(RunDetailDto detail, string? hostAgentExecutionMode, CancellationToken cancellationToken = default) =>
        _composer.EnrichOperatorAsync(detail, hostAgentExecutionMode, cancellationToken);

    /// <inheritdoc />
    public Task EnrichBuyerSummaryAsync(RunDetailDto detail, string? hostAgentExecutionMode, CancellationToken cancellationToken = default) =>
        _composer.EnrichBuyerSummaryAsync(detail, hostAgentExecutionMode, cancellationToken);
}
