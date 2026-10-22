using ArchLucid.Api.Hosting;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DemoSeedStartupHostedServiceTests
{
    [Fact]
    public async Task RunAsync_when_showcase_policy_disabled_skips_seed()
    {
        Mock<IDemoSeedService> demoSeed = new();
        ServiceCollection services = new();
        services.AddSingleton(demoSeed.Object);
        IServiceScopeFactory scopeFactory = services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();

        DemoOptions options = new()
        {
            Enabled = true,
            AnonymousViewer = new DemoAnonymousViewerOptions { Enabled = false },
        };

        await DemoSeedStartupWork.RunAsync(
            scopeFactory,
            new StubHostEnvironment("Production"),
            options,
            NullLogger.Instance,
            CancellationToken.None);

        demoSeed.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RunAsync_when_anonymous_viewer_enabled_calls_seed()
    {
        Mock<IDemoSeedService> demoSeed = new();
        demoSeed.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        ServiceCollection services = new();
        services.AddSingleton(demoSeed.Object);
        IServiceScopeFactory scopeFactory = services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();

        DemoOptions options = new()
        {
            Enabled = true,
            AnonymousViewer = new DemoAnonymousViewerOptions { Enabled = true },
        };

        await DemoSeedStartupWork.RunAsync(
            scopeFactory,
            new StubHostEnvironment("Production"),
            options,
            NullLogger.Instance,
            CancellationToken.None);

        demoSeed.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RunAsync_when_seed_throws_does_not_propagate()
    {
        Mock<IDemoSeedService> demoSeed = new();
        demoSeed
            .Setup(s => s.SeedAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("seed failed"));
        ServiceCollection services = new();
        services.AddSingleton(demoSeed.Object);
        IServiceScopeFactory scopeFactory = services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();

        DemoOptions options = new()
        {
            Enabled = true,
            AnonymousViewer = new DemoAnonymousViewerOptions { Enabled = true },
        };

        Func<Task> act = () => DemoSeedStartupWork.RunAsync(
            scopeFactory,
            new StubHostEnvironment("Production"),
            options,
            NullLogger.Instance,
            CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    private sealed class StubHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;

        public string ApplicationName { get; set; } = "ArchLucid.Api.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
