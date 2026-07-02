using ArchLucid.Core.Metering;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Middleware;

/// <summary>
///     Records one <see cref="UsageMeterKind.ApiRequest" /> per completed versioned API call when metering is
///     enabled.
/// </summary>
/// <remarks>
///     Implements <see cref="IMiddleware" /> so <see cref="IApiRequestUsageEventBuffer" /> (singleton) is resolved per
///     request without blocking on SQL (TB-582).
/// </remarks>
internal sealed class ApiRequestMeteringMiddleware(
    IScopeContextProvider scopeProvider,
    IApiRequestUsageEventBuffer apiRequestUsageBuffer,
    IOptionsMonitor<MeteringOptions> meteringOptions,
    ILogger<ApiRequestMeteringMiddleware> logger) : IMiddleware
{
    private readonly IApiRequestUsageEventBuffer _apiRequestUsageBuffer =
        apiRequestUsageBuffer ?? throw new ArgumentNullException(nameof(apiRequestUsageBuffer));

    private readonly ILogger<ApiRequestMeteringMiddleware> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptionsMonitor<MeteringOptions> _meteringOptions =
        meteringOptions ?? throw new ArgumentNullException(nameof(meteringOptions));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        await next(context);

        if (!_meteringOptions.CurrentValue.Enabled)
            return;

        string path = context.Request.Path.Value ?? string.Empty;

        if (!path.StartsWith("/v", StringComparison.OrdinalIgnoreCase))
            return;

        if (path.Contains("/health", StringComparison.OrdinalIgnoreCase) ||
            path.Contains("/swagger", StringComparison.OrdinalIgnoreCase))
            return;

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return;

        try
        {
            _apiRequestUsageBuffer.Enqueue(
                new UsageEvent
                {
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    Kind = UsageMeterKind.ApiRequest,
                    Quantity = 1,
                    RecordedUtc = TimeProvider.System.GetUtcNow(),
                    CorrelationId = context.TraceIdentifier,
                    IdempotencyKey = UsageEventIdempotencyKeys.ForApiRequest(context.TraceIdentifier)
                });
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))

                _logger.LogWarning(ex, "Usage metering enqueue failed for API request (tenant {TenantId}).", scope.TenantId);
        }
    }
}
