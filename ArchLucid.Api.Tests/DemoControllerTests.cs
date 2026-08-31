using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Runs.Sample;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DemoControllerTests
{
    private static DemoController CreateController(
        Mock<IDemoSeedService>? demoSeed = null,
        Mock<ISampleRunPurgeService>? samplePurge = null,
        Mock<IScopeContextProvider>? scopeProvider = null,
        DemoOptions? demoOptions = null,
        string? environmentName = null)
    {
        Mock<IDemoSeedService> seed = demoSeed ?? new Mock<IDemoSeedService>();
        Mock<ISampleRunPurgeService> purge = samplePurge ?? new Mock<ISampleRunPurgeService>();
        Mock<IScopeContextProvider> scope = scopeProvider ?? new Mock<IScopeContextProvider>();

        if (scopeProvider is null)
        {
            scope.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext
            {
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            });
        }
        Mock<IWebHostEnvironment> env = new();
        env.SetupGet(e => e.EnvironmentName).Returns(environmentName ?? Environments.Development);

        return new DemoController(
            seed.Object,
            purge.Object,
            scope.Object,
            Options.Create(demoOptions ?? new DemoOptions { Enabled = true }),
            env.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }
    [SkippableFact]
    public async Task SeedAsync_returns_not_found_when_not_development()
    {
        Mock<IDemoSeedService> demoSeed = new();
        DemoController sut = CreateController(demoSeed, environmentName: Environments.Production);

        IActionResult result = await sut.SeedAsync(CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        demoSeed.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task SeedAsync_returns_no_content_in_production_when_saas_guest_seed_enabled()
    {
        // V1 Operator Shell — OS-1: production-hosted SaaS tenants opt in via Demo:SaaSGuestSeedEnabled.
        Mock<IDemoSeedService> demoSeed = new();
        demoSeed.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        DemoController sut = CreateController(
            demoSeed,
            demoOptions: new DemoOptions { Enabled = true, SaaSGuestSeedEnabled = true },
            environmentName: Environments.Production);

        IActionResult result = await sut.SeedAsync(CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        demoSeed.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [SkippableFact]
    public async Task SeedAsync_returns_not_found_in_production_when_saas_guest_seed_disabled()
    {
        // OS-1 default: production-hosted SaaS tenants without explicit opt-in must continue to receive 404.
        Mock<IDemoSeedService> demoSeed = new();
        DemoController sut = CreateController(
            demoSeed,
            demoOptions: new DemoOptions { Enabled = true, SaaSGuestSeedEnabled = false },
            environmentName: Environments.Production);

        IActionResult result = await sut.SeedAsync(CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        demoSeed.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task SeedAsync_returns_bad_request_in_production_when_saas_guest_seed_enabled_but_demo_disabled()
    {
        // OS-1 keeps Demo:Enabled as the master switch — SaaSGuestSeedEnabled alone must not bypass it.
        Mock<IDemoSeedService> demoSeed = new();
        DemoController sut = CreateController(
            demoSeed,
            demoOptions: new DemoOptions { Enabled = false, SaaSGuestSeedEnabled = true },
            environmentName: Environments.Production);

        IActionResult result = await sut.SeedAsync(CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        demoSeed.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task SeedAsync_returns_bad_request_when_demo_disabled()
    {
        Mock<IDemoSeedService> demoSeed = new();
        DemoController sut = CreateController(demoSeed, demoOptions: new DemoOptions { Enabled = false });

        IActionResult result = await sut.SeedAsync(CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        demoSeed.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task SeedAsync_seeds_and_returns_no_content_when_development_and_enabled()
    {
        Mock<IDemoSeedService> demoSeed = new();
        demoSeed.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        DemoController sut = CreateController(demoSeed);

        IActionResult result = await sut.SeedAsync(CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        demoSeed.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [SkippableFact]
    public async Task PurgeSampleAsync_purges_tenant_sample_runs_when_development_and_enabled()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<ISampleRunPurgeService> samplePurge = new();
        samplePurge
            .Setup(s => s.PurgeForTenantAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SampleRunPurgeResult { RunsDeleted = 2 });
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        });
        DemoController sut = CreateController(samplePurge: samplePurge, scopeProvider: scopeProvider);

        IActionResult result = await sut.PurgeSampleAsync(CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        samplePurge.Verify(s => s.PurgeForTenantAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
