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
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            using IServiceScope scope = factory.Services.CreateScope();

            List<IHostedService> hostedServices = scope.ServiceProvider.GetServices<IHostedService>().ToList();

            hostedServices.Should().NotBeEmpty();

            hostedServices.Should().Contain(
                s =>
                    s.GetType().Name.Contains("BackgroundJobQueueProcessorHostedService", StringComparison.Ordinal)
                    || s.GetType().Name.Contains("DataConsistencyOrphanProbeHostedService", StringComparison.Ordinal));
        }
        finally
        {
            snapshot.Restore();
        }
    }
}
