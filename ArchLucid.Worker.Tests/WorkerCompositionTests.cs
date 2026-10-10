using ArchLucid.Core.Hosting;
using ArchLucid.Core.Scoping;

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
    public void Worker_composition_registers_worker_host_drain_gate()
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

            factory.Services.GetRequiredService<IWorkerHostDrainGate>().Should().NotBeNull();
        }
        finally
        {
            snapshot.Restore();
        }
    }

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

    [Fact]
    public void Worker_scope_provider_uses_defaults_without_http_context()
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

            IScopeContextProvider provider = factory.Services.GetRequiredService<IScopeContextProvider>();

            ScopeContext scope = provider.GetCurrentScope();

            scope.TenantId.Should().Be(ScopeIds.DefaultTenant);
            scope.WorkspaceId.Should().Be(ScopeIds.DefaultWorkspace);
            scope.ProjectId.Should().Be(ScopeIds.DefaultProject);
        }
        finally
        {
            snapshot.Restore();
        }
    }

    [Fact]
    public void Worker_scope_provider_prefers_ambient_override_over_defaults_without_http()
    {
        WorkerTestArchLucidAuthEnvSnapshot snapshot = WorkerTestArchLucidAuthEnvSnapshot.CaptureAndApplyWorkerDefaults();
        Guid tenant = Guid.NewGuid();

        try
        {
            using WebApplicationFactory<Program> factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseSetting("ArchLucid:StorageProvider", "InMemory");
                    builder.UseSetting("ConnectionStrings:Redis", "localhost");
                });

            IScopeContextProvider provider = factory.Services.GetRequiredService<IScopeContextProvider>();

            ScopeContext pushed = new()
            {
                TenantId = tenant,
                WorkspaceId = ScopeIds.DefaultWorkspace,
                ProjectId = ScopeIds.DefaultProject,
            };

            using (AmbientScopeContext.Push(pushed))
            {
                provider.GetCurrentScope().TenantId.Should().Be(tenant);
            }
        }
        finally
        {
            snapshot.Restore();
        }
    }
}
