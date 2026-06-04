using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Hosted;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests.Hosted;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TrialArchitecturePreseedHostedServiceTests
{
    [Fact]
    public async Task PollLoop_processes_pending_tenants_and_continues_after_one_tenant_fails()
    {
        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();
        int listCalls = 0;

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.ListTenantIdsPendingTrialArchitecturePreseedAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                () =>
                {
                    listCalls++;

                    return listCalls == 1 ? (IReadOnlyList<Guid>)[tenantA, tenantB] : [];
                });

        tenants.Setup(t => t.GetFirstWorkspaceAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink { WorkspaceId = Guid.NewGuid(), DefaultProjectId = Guid.NewGuid() });

        tenants.Setup(t => t.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (Guid id, CancellationToken _) => new TenantRecord
                {
                    Id = id,
                    Name = "Trial",
                    Slug = "trial",
                    Tier = TenantTier.Free,
                    CreatedUtc = DateTimeOffset.UtcNow,
                    TrialStatus = TrialLifecycleStatus.Active,
                    IndustryVertical = "Healthcare",
                });

        Mock<IArchitectureRunCreateOrchestrator> create = new();
        Mock<IArchitectureRunExecuteOrchestrator> execute = new();
        Mock<IArchitectureRunCommitOrchestrator> commit = new();

        create.Setup(c => c.CreateRunAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<ArchLucid.Application.Runs.CreateRunIdempotencyState?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (ArchitectureRequest _, ArchLucid.Application.Runs.CreateRunIdempotencyState? _, CancellationToken _) =>
                    new CreateRunResult { Run = new ArchitectureRun { RunId = Guid.NewGuid().ToString("N"), RequestId = "req" } });

        execute.Setup(e => e.ExecuteRunAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string runId, CancellationToken _) => new ExecuteRunResult { RunId = runId });

        commit.SetupSequence(c => c.CommitRunAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("first tenant fails"))
            .ReturnsAsync(new CommitRunResult { Manifest = new GoldenManifest { Metadata = new ManifestMetadata { ManifestVersion = "1" } } });

        tenants.Setup(t => t.IncrementTrialArchitecturePreseedAttemptAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        tenants.Setup(t => t.MarkTrialArchitecturePreseedCompletedAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ServiceCollection services = [];
        services.AddSingleton<ILogger<TrialArchitecturePreseedExecutor>>(NullLogger<TrialArchitecturePreseedExecutor>.Instance);
        services.AddScoped(_ => tenants.Object);
        services.AddScoped<TrialArchitecturePreseedExecutor>();
        services.AddScoped(_ => create.Object);
        services.AddScoped(_ => execute.Object);
        services.AddScoped(_ => commit.Object);
        services.AddScoped(_ => new Mock<IAuditService>().Object);
        ServiceProvider provider = services.BuildServiceProvider();

        Mock<IOptionsMonitor<HostLeaderElectionOptions>> electionOpts = new();
        electionOpts.Setup(o => o.CurrentValue).Returns(new HostLeaderElectionOptions { Enabled = false });

        HostLeaderElectionCoordinator coordinator = new(
            electionOpts.Object,
            new NoOpHostLeaderLeaseRepository(),
            HostInstanceIdentifier.ForTests("host-core-tests"),
            NullLogger<HostLeaderElectionCoordinator>.Instance);

        Mock<IOptionsMonitor<TrialArchitecturePreseedOptions>> preseedOpts = new();
        preseedOpts.Setup(o => o.CurrentValue)
            .Returns(new TrialArchitecturePreseedOptions { Enabled = true, PollIntervalSeconds = 1, BatchSize = 10 });

        TrialArchitecturePreseedHostedService sut = new(
            provider,
            coordinator,
            preseedOpts.Object,
            NullLogger<TrialArchitecturePreseedHostedService>.Instance);

        using CancellationTokenSource cts = new();
        await sut.StartAsync(cts.Token);
        await Task.Delay(7000, CancellationToken.None);
        await cts.CancelAsync();
        await sut.StopAsync(CancellationToken.None);

        tenants.Verify(t => t.IncrementTrialArchitecturePreseedAttemptAsync(tenantA, It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        tenants.Verify(t => t.MarkTrialArchitecturePreseedCompletedAsync(tenantB, It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        listCalls.Should().BeGreaterThanOrEqualTo(2);
    }
}
