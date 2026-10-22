using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Application.Tests.Bootstrap;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DemoSeedBootstrapPolicyTests
{
    [Fact]
    public void ShouldSeedShowcaseOnStartup_is_false_when_demo_disabled()
    {
        DemoOptions demo = new() { Enabled = false, SeedOnStartup = true, EnableShowcaseSeed = true };

        Assert.False(DemoSeedBootstrapPolicy.ShouldSeedShowcaseOnStartup(new StubHostEnvironment("Development"), demo));
    }

    [Fact]
    public void ShouldSeedShowcaseOnStartup_is_true_in_development_when_seed_on_startup()
    {
        DemoOptions demo = new() { Enabled = true, SeedOnStartup = true };

        Assert.True(DemoSeedBootstrapPolicy.ShouldSeedShowcaseOnStartup(new StubHostEnvironment("Development"), demo));
    }

    [Fact]
    public void ShouldSeedShowcaseOnStartup_is_false_in_production_without_explicit_showcase_flag()
    {
        DemoOptions demo = new() { Enabled = true, SeedOnStartup = true };

        Assert.False(DemoSeedBootstrapPolicy.ShouldSeedShowcaseOnStartup(new StubHostEnvironment("Production"), demo));
    }

    [Fact]
    public void ShouldSeedShowcaseOnStartup_is_true_in_production_when_enable_showcase_seed()
    {
        DemoOptions demo = new() { Enabled = true, EnableShowcaseSeed = true };

        Assert.True(DemoSeedBootstrapPolicy.ShouldSeedShowcaseOnStartup(new StubHostEnvironment("Production"), demo));
    }

    [Fact]
    public void ShouldSeedShowcaseOnStartup_is_true_when_anonymous_viewer_enabled()
    {
        DemoOptions demo = new()
        {
            Enabled = true,
            AnonymousViewer = new DemoAnonymousViewerOptions { Enabled = true },
        };

        Assert.True(DemoSeedBootstrapPolicy.ShouldSeedShowcaseOnStartup(new StubHostEnvironment("Production"), demo));
    }

    private sealed class StubHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;

        public string ApplicationName { get; set; } = "ArchLucid.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
