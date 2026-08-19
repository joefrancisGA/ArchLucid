using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Configuration;

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
    [SkippableFact]
    public async Task SeedAsync_returns_not_found_when_not_development()
    {
        Mock<IDemoSeedService> demoSeed = new();
        Mock<IWebHostEnvironment> env = new();
        env.SetupGet(e => e.EnvironmentName).Returns(Environments.Production);
        DemoController sut = new(demoSeed.Object, Options.Create(new DemoOptions { Enabled = true }), env.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

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
        Mock<IWebHostEnvironment> env = new();
        env.SetupGet(e => e.EnvironmentName).Returns(Environments.Production);
        DemoController sut = new(
            demoSeed.Object,
            Options.Create(new DemoOptions { Enabled = true, SaaSGuestSeedEnabled = true }),
            env.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult result = await sut.SeedAsync(CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        demoSeed.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [SkippableFact]
    public async Task SeedAsync_returns_not_found_in_production_when_saas_guest_seed_disabled()
    {
        // OS-1 default: production-hosted SaaS tenants without explicit opt-in must continue to receive 404.
        Mock<IDemoSeedService> demoSeed = new();
        Mock<IWebHostEnvironment> env = new();
        env.SetupGet(e => e.EnvironmentName).Returns(Environments.Production);
        DemoController sut = new(
            demoSeed.Object,
            Options.Create(new DemoOptions { Enabled = true, SaaSGuestSeedEnabled = false }),
            env.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

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
        Mock<IWebHostEnvironment> env = new();
        env.SetupGet(e => e.EnvironmentName).Returns(Environments.Production);
        DemoController sut = new(
            demoSeed.Object,
            Options.Create(new DemoOptions { Enabled = false, SaaSGuestSeedEnabled = true }),
            env.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult result = await sut.SeedAsync(CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        demoSeed.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task SeedAsync_returns_bad_request_when_demo_disabled()
    {
        Mock<IDemoSeedService> demoSeed = new();
        Mock<IWebHostEnvironment> env = new();
        env.SetupGet(e => e.EnvironmentName).Returns(Environments.Development);
        DemoController sut = new(demoSeed.Object, Options.Create(new DemoOptions { Enabled = false }), env.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

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
        Mock<IWebHostEnvironment> env = new();
        env.SetupGet(e => e.EnvironmentName).Returns(Environments.Development);
        DemoController sut = new(demoSeed.Object, Options.Create(new DemoOptions { Enabled = true }), env.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult result = await sut.SeedAsync(CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        demoSeed.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
