using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.Scoping;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.Security;

/// <summary>Opt-in, bounded worker. Configuration selects candidates only; every
/// execution still requires independently authenticated worker authorization.</summary>
internal sealed class RuntimeSecurityScheduledWorker(
    IConfiguration config, IServiceScopeFactory scopes, ILogger<RuntimeSecurityScheduledWorker> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(2));
        do
        {
            if (RuntimeTelemetryProvisioning.Enabled(config) &&
                bool.TryParse(config["SecureNow:RuntimeTelemetry:SchedulerEnabled"], out bool enabled) && enabled)
                await SweepAsync(stoppingToken);
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    internal async Task SweepAsync(CancellationToken ct)
    {
        var root = config.GetSection("SecureNow:RuntimeTelemetry:Scopes");
        // Reject over-large configurations rather than silently starving later scopes.
        var candidates = root.GetChildren().Take(33).ToArray();

        if (candidates.Length > 32)
        {
            logger.LogWarning("Runtime security scheduler exceeds its configured scope limit.");
            return;
        }

        foreach (var candidate in candidates)
        {
            ct.ThrowIfCancellationRequested();

            if (!RuntimeTelemetryProvisioning.Enabled(config) ||
                !bool.TryParse(config["SecureNow:RuntimeTelemetry:SchedulerEnabled"], out bool enabled) || !enabled)
                return;
            string? json = candidate["ScheduledRequestJson"];

            if (json is not { Length: > 0 and <= 8192 }) continue;
            try
            {
                var request = JsonSerializer.Deserialize<RuntimeObservationRequest>(json);

                if (request is null || !string.Equals(candidate.Key,
                    RuntimeTelemetryProvisioning.ScopeKey(request), StringComparison.OrdinalIgnoreCase))
                    continue;
                var scope = new ScopeContext
                {
                    TenantId = request.TenantId, WorkspaceId = request.WorkspaceId, ProjectId = request.ProjectId
                };
                using var deadline = CancellationTokenSource.CreateLinkedTokenSource(ct);
                deadline.CancelAfter(TimeSpan.FromSeconds(45));
                await using var services = scopes.CreateAsyncScope();
                var executor = services.ServiceProvider.GetRequiredService<RuntimeSecurityExecutionService>();
                var result = await executor.ExecuteAsync(scope, request, TimeSpan.FromMinutes(5), deadline.Token);

                if (result.Candidates > 0 && !result.Persisted)
                    logger.LogWarning("Runtime security assessment generated candidates but persistence was not confirmed.");
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                // Avoid logging evidence, request identifiers or credentials.
                logger.LogWarning("Runtime security scheduled execution failed ({FailureType}).", ex.GetType().Name);
            }
        }
    }
}
