using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Host.Core.Hosted;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Worker.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class WorkerCompositionTests
{
    [Fact]
    public void Worker_starts_and_registers_expected_background_services()
    {
        Environment.SetEnvironmentVariable("ArchLucidAuth__Authority", "https://mock.example.com/");
        Environment.SetEnvironmentVariable("ArchLucidAuth__Audience", "mock");
        
        using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                builder.UseSetting("ConnectionStrings:Redis", "localhost");
            });

        using var scope = factory.Services.CreateScope();
        
        var hostedServices = scope.ServiceProvider.GetServices<IHostedService>().ToList();

        // Let's assert that the container can yield expected background services without crashing.
        hostedServices.Should().NotBeEmpty();
        
        // Assert some key hosted services are registered
        hostedServices.Should().Contain(s => s.GetType().Name.Contains("BackgroundJobQueueProcessorHostedService") || s.GetType().Name.Contains("DataConsistencyOrphanProbeHostedService"));
    }
}
