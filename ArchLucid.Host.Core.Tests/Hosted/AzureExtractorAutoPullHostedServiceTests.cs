using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests.Hosted;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AzureExtractorAutoPullHostedServiceTests
{
  [Fact]
  public async Task StartAsync_when_enabled_invokes_orchestrator_before_shutdown()
  {
    Mock<IAzureExtractorAutoPullOrchestrator> orchestrator = new();
    orchestrator
      .Setup(o => o.RunScheduledPullAsync(It.IsAny<CancellationToken>()))
      .Returns(Task.CompletedTask);

    ServiceCollection services = [];
    services.AddSingleton<IAzureExtractorAutoPullOrchestrator>(orchestrator.Object);
    ServiceProvider provider = services.BuildServiceProvider();
    IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

    Mock<IOptionsMonitor<AzureExtractorAutoPullOptions>> autoPullOpts = new();
    autoPullOpts.Setup(o => o.CurrentValue).Returns(new AzureExtractorAutoPullOptions
    {
      Enabled = true,
      IntervalMinutes = 15,
    });

    Mock<IOptionsMonitor<HostLeaderElectionOptions>> electionOpts = new();
    electionOpts.Setup(o => o.CurrentValue).Returns(new HostLeaderElectionOptions { Enabled = false });

    HostLeaderElectionCoordinator coordinator = new(
      electionOpts.Object,
      new NoOpHostLeaderLeaseRepository(),
      HostInstanceIdentifier.ForTests("host-core-auto-pull-tests"),
      NullLogger<HostLeaderElectionCoordinator>.Instance);

    AzureExtractorAutoPullHostedService sut = new(
      scopeFactory,
      autoPullOpts.Object,
      NullLogger<AzureExtractorAutoPullHostedService>.Instance,
      coordinator);

    using CancellationTokenSource cts = new();
    await sut.StartAsync(cts.Token);
    await Task.Delay(200, CancellationToken.None);
    await cts.CancelAsync();
    await sut.StopAsync(CancellationToken.None);

    orchestrator.Verify(
      o => o.RunScheduledPullAsync(It.IsAny<CancellationToken>()),
      Times.AtLeastOnce);
  }

  [Fact]
  public async Task StartAsync_when_disabled_does_not_invoke_orchestrator()
  {
    Mock<IAzureExtractorAutoPullOrchestrator> orchestrator = new();

    ServiceCollection services = [];
    services.AddSingleton<IAzureExtractorAutoPullOrchestrator>(orchestrator.Object);
    ServiceProvider provider = services.BuildServiceProvider();
    IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

    Mock<IOptionsMonitor<AzureExtractorAutoPullOptions>> autoPullOpts = new();
    autoPullOpts.Setup(o => o.CurrentValue).Returns(new AzureExtractorAutoPullOptions
    {
      Enabled = false,
      IntervalMinutes = 15,
    });

    Mock<IOptionsMonitor<HostLeaderElectionOptions>> electionOpts = new();
    electionOpts.Setup(o => o.CurrentValue).Returns(new HostLeaderElectionOptions { Enabled = false });

    HostLeaderElectionCoordinator coordinator = new(
      electionOpts.Object,
      new NoOpHostLeaderLeaseRepository(),
      HostInstanceIdentifier.ForTests("host-core-auto-pull-disabled"),
      NullLogger<HostLeaderElectionCoordinator>.Instance);

    AzureExtractorAutoPullHostedService sut = new(
      scopeFactory,
      autoPullOpts.Object,
      NullLogger<AzureExtractorAutoPullHostedService>.Instance,
      coordinator);

    using CancellationTokenSource cts = new();
    await sut.StartAsync(cts.Token);
    await Task.Delay(200, CancellationToken.None);
    await cts.CancelAsync();
    await sut.StopAsync(CancellationToken.None);

    orchestrator.Verify(
      o => o.RunScheduledPullAsync(It.IsAny<CancellationToken>()),
      Times.Never);
  }
}
