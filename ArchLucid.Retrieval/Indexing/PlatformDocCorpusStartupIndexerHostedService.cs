using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>
///     Refreshes platform ADR corpus chunks on host startup (fail-open).
/// </summary>
public sealed class PlatformDocCorpusStartupIndexerHostedService(
    PlatformDocCorpusIndexer indexer,
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<PlatformDocCorpusIndexerOptions> options,
    ILogger<PlatformDocCorpusStartupIndexerHostedService> logger) : IHostedService
{
    private readonly PlatformDocCorpusIndexer _indexer =
        indexer ?? throw new ArgumentNullException(nameof(indexer));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<PlatformDocCorpusIndexerOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<PlatformDocCorpusStartupIndexerHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_options.CurrentValue.IndexOnStartup)
            return;

        try
        {
            IReadOnlyList<Models.RetrievalDocument> documents =
                await _indexer.BuildDocumentsAsync(cancellationToken).ConfigureAwait(false);

            if (documents.Count == 0)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                    _logger.LogWarning("Platform doc corpus indexer found no ADR markdown documents.");

                return;
            }

            using IServiceScope scope = _scopeFactory.CreateScope();
            IRetrievalIndexingService indexingService = scope.ServiceProvider.GetRequiredService<IRetrievalIndexingService>();

            await indexingService.IndexDocumentsAsync(documents, cancellationToken).ConfigureAwait(false);

            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Indexed {Count} platform ADR documents for retrieval.", documents.Count);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            RetrievalCorpusStartupIndexerTelemetry.RecordFailure(nameof(CorpusKind.PlatformDoc));

            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Platform doc corpus startup indexing failed; retrieval will continue fail-open.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
