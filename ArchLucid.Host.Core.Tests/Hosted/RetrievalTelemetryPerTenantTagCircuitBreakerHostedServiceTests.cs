using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Diagnostics;
using ArchLucid.Host.Core.Hosted;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Tests.Hosted;

[Collection("ArchLucidInstrumentation")]
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalTelemetryPerTenantTagCircuitBreakerHostedServiceTests
{
    [Fact]
    public async Task StartAsync_wires_instrumentation_circuit_breaker()
    {
        ServiceCollection services = new();
        services.AddOptions<RetrievalTelemetryOptions>();
        services.Configure<RetrievalTelemetryOptions>(static options =>
        {
            options.RecordPerTenantTags = true;
            options.EstimatedTenantCount = 150;
            options.MaxRecommendedTenantCountForPerTenantTags = 100;
        });
        services.AddSingleton<RetrievalTelemetryPerTenantTagCircuitBreaker>();
        services.AddHostedService<RetrievalTelemetryPerTenantTagCircuitBreakerHostedService>();

        await using ServiceProvider provider = services.BuildServiceProvider();
        RetrievalTelemetryPerTenantTagCircuitBreaker breaker =
            provider.GetRequiredService<RetrievalTelemetryPerTenantTagCircuitBreaker>();
        IHostedService hosted = provider
            .GetServices<IHostedService>()
            .OfType<RetrievalTelemetryPerTenantTagCircuitBreakerHostedService>()
            .Single();

        try
        {
            await hosted.StartAsync(CancellationToken.None);
            await hosted.StopAsync(CancellationToken.None);

            breaker.ShouldSuppressTenantIdTags().Should().BeTrue();
        }
        finally
        {
            ArchLucidInstrumentation.SetRetrievalTelemetryPerTenantTagCircuitBreaker(null);
        }
    }

    [Fact]
    public async Task Resolving_breaker_and_options_monitor_concurrently_does_not_deadlock()
    {
        ServiceCollection services = new();
        services.AddOptions<RetrievalTelemetryOptions>();
        services.AddSingleton<RetrievalTelemetryPerTenantTagCircuitBreaker>();
        services.AddHostedService<RetrievalTelemetryPerTenantTagCircuitBreakerHostedService>();

        await using ServiceProvider provider = services.BuildServiceProvider();

        Task[] tasks = Enumerable.Range(0, 8)
            .Select(i => Task.Run(() =>
            {
                RetrievalTelemetryPerTenantTagCircuitBreaker resolvedBreaker =
                    provider.GetRequiredService<RetrievalTelemetryPerTenantTagCircuitBreaker>();
                IOptionsMonitor<RetrievalTelemetryOptions> monitor =
                    provider.GetRequiredService<IOptionsMonitor<RetrievalTelemetryOptions>>();

                resolvedBreaker.Should().NotBeNull();
                monitor.Should().NotBeNull();
                return i;
            }))
            .ToArray();

        Func<Task> act = () => Task.WhenAll(tasks).WaitAsync(TimeSpan.FromSeconds(3));

        await act.Should().NotThrowAsync();
    }
}
