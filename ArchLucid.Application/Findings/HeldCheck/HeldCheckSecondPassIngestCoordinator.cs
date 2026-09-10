using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Findings.HeldCheck;

/// <summary>Fire-and-forget held-check second pass after inventory ingest (DX-60).</summary>
public static class HeldCheckSecondPassIngestCoordinator
{
    public static async Task TryRunAfterIngestAsync(
        IHeldCheckSecondPassService? secondPassService,
        ILogger? logger,
        ScopeContext scope,
        Guid? runId,
        HeldCheckInputCode inputCode,
        Guid packageId,
        CancellationToken cancellationToken)
    {
        if (secondPassService is null || runId is null)
        {
            return;
        }

        try
        {
            await secondPassService
                .TryRunAsync(scope, runId.Value, inputCode, packageId, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (logger is not null && logger.IsEnabled(LogLevel.Warning))
            {
                logger.LogWarning(
                    ex,
                    "Held-check second pass failed after inventory ingest for RunId={RunId} InputCode={InputCode}.",
                    runId,
                    inputCode);
            }
        }
    }
}
