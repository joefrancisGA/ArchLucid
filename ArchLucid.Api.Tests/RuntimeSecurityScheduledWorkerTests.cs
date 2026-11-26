using System.Text.Json;
using ArchLucid.Api.Security;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RuntimeSecurityScheduledWorkerTests
{
    private static RuntimeObservationRequest Request() => new(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
        "resource", "generation", "php");

    [Fact]
    public async Task Invalid_scope_hash_never_resolves_executor()
    {
        var request = Request();
        using var provider = new ServiceCollection().BuildServiceProvider();
        var config = Configuration(new Dictionary<string, string?>
        {
            ["SecureNow:RuntimeTelemetry:Scopes:invalid:ScheduledRequestJson"] = JsonSerializer.Serialize(request)
        });
        using var worker = new RuntimeSecurityScheduledWorker(config, provider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<RuntimeSecurityScheduledWorker>.Instance);
        await worker.SweepAsync(default);
    }

    [Fact]
    public async Task Disabled_scheduler_never_invokes_configured_scope()
    {
        var request = Request();
        using var provider = new ServiceCollection().BuildServiceProvider();
        var config = Configuration(new Dictionary<string, string?>
        {
            ["SecureNow:RuntimeTelemetry:SchedulerEnabled"] = "false",
            ["SecureNow:RuntimeTelemetry:Scopes:" + RuntimeTelemetryProvisioning.ScopeKey(request) + ":ScheduledRequestJson"] =
                JsonSerializer.Serialize(request)
        });
        using var worker = new RuntimeSecurityScheduledWorker(config, provider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<RuntimeSecurityScheduledWorker>.Instance);
        await worker.SweepAsync(default);
    }

    [Fact]
    public async Task Over_limit_configuration_is_rejected_and_cancellation_propagates()
    {
        using var provider = new ServiceCollection().BuildServiceProvider();
        var entries = new Dictionary<string, string?>();
        for (int i = 0; i < 33; i++)
        {
            var request = Request();
            entries["SecureNow:RuntimeTelemetry:Scopes:" + RuntimeTelemetryProvisioning.ScopeKey(request) + ":ScheduledRequestJson"] =
                JsonSerializer.Serialize(request);
        }
        using var worker = new RuntimeSecurityScheduledWorker(Configuration(entries),
            provider.GetRequiredService<IServiceScopeFactory>(), NullLogger<RuntimeSecurityScheduledWorker>.Instance);
        await worker.SweepAsync(default);

        var single = Request();
        using var cancelledWorker = new RuntimeSecurityScheduledWorker(Configuration(new Dictionary<string, string?>
        {
            ["SecureNow:RuntimeTelemetry:Scopes:" + RuntimeTelemetryProvisioning.ScopeKey(single) + ":ScheduledRequestJson"] =
                JsonSerializer.Serialize(single)
        }), provider.GetRequiredService<IServiceScopeFactory>(), NullLogger<RuntimeSecurityScheduledWorker>.Instance);
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => cancelledWorker.SweepAsync(new CancellationToken(true)));
    }

    private static IConfiguration Configuration(Dictionary<string, string?> entries)
    {
        entries.TryAdd("SecureNow:RuntimeTelemetry:Enabled", "true");
        entries.TryAdd("SecureNow:RuntimeTelemetry:SchedulerEnabled", "true");
        return new ConfigurationBuilder().AddInMemoryCollection(entries).Build();
    }
}
