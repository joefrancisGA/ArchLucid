using ArchLucid.Contracts.Requests;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration;

public static class TechnologyLedgerRunCreateSeeding
{
    public static async Task TrySeedIntakeAsync(
        string runId,
        ArchitectureRequest request,
        TechnologyLedgerRequestSeeder requestSeeder,
        TechnologyLedgerEvidenceSeeder evidenceSeeder,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(requestSeeder);
        ArgumentNullException.ThrowIfNull(evidenceSeeder);
        ArgumentNullException.ThrowIfNull(logger);

        try
        {
            await requestSeeder.SeedAsync(runId, request, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning(ex, "Technology Ledger request seeding failed for RunId={RunId}; run creation continues.", runId);
        }

        try
        {
            await evidenceSeeder.SeedAsync(runId, request, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning(ex, "Technology Ledger evidence seeding failed for RunId={RunId}; run creation continues.", runId);
        }
    }
}
