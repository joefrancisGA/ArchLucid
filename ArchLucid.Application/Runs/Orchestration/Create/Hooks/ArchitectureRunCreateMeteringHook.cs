using ArchLucid.Core.Metering;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Create.Hooks;

public interface IArchitectureRunCreateMeteringHook
{
    Task TryRecordArchitectureRunMeteringAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken);
}

public sealed class ArchitectureRunCreateMeteringHook(
    IUsageMeteringService usageMetering,
    TimeProvider timeProvider,
    ILogger<ArchitectureRunCreateMeteringHook> logger) : IArchitectureRunCreateMeteringHook
{
    private readonly IUsageMeteringService _usageMetering =
        usageMetering ?? throw new ArgumentNullException(nameof(usageMetering));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly ILogger<ArchitectureRunCreateMeteringHook> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task TryRecordArchitectureRunMeteringAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken)
    {
        if (scope.TenantId == Guid.Empty)
            return;

        try
        {
            await _usageMetering
                .RecordAsync(
                    new UsageEvent
                    {
                        TenantId = scope.TenantId,
                        WorkspaceId = scope.WorkspaceId,
                        ProjectId = scope.ProjectId,
                        Kind = UsageMeterKind.ArchitectureRun,
                        Quantity = 1,
                        RecordedUtc = _timeProvider.GetUtcNow(),
                        CorrelationId = runId,
                        IdempotencyKey = UsageEventIdempotencyKeys.ForArchitectureRun(runId),
                    },
                    cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(ex, "Usage metering failed for architecture run (tenant {TenantId}).", scope.TenantId);
            }
        }
    }
}
