using ArchLucid.Core.OperationalErrors;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>One retention purge cycle for aged platform operational error rows.</summary>
public static class OperationalErrorRetentionIteration
{
    public static async Task RunOnceAsync(
        IServiceScopeFactory scopeFactory,
        OperationalErrorOptions opts,
        ILogger logger,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scopeFactory);
        ArgumentNullException.ThrowIfNull(opts);
        ArgumentNullException.ThrowIfNull(logger);

        if (opts.RetentionDays <= 0)
            return;

        using IServiceScope scope = scopeFactory.CreateScope();
        IOperationalErrorRepository repository =
            scope.ServiceProvider.GetRequiredService<IOperationalErrorRepository>();

        DateTime cutoffUtc = TimeProvider.System.UtcNowDateTime().AddDays(-opts.RetentionDays);
        int batchSize = opts.RetentionPurgeBatchSize > 0 ? opts.RetentionPurgeBatchSize : 1000;

        int deleted = await repository.DeleteOlderThanAsync(cutoffUtc, batchSize, ct).ConfigureAwait(false);

        if (deleted > 0 && logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("Operational error retention purge deleted {DeletedRows} rows older than {CutoffUtc:O}.", deleted, cutoffUtc);
    }
}
