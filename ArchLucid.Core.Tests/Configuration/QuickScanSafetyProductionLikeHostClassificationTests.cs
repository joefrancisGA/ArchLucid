using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class QuickScanSafetyProductionLikeHostClassificationTests
{
    [Fact]
    public void RequiresProductionLikeAnonymousGuardrails_is_true_for_saas_environment()
    {
        IHostEnvironment hostEnvironment = new TestHostEnvironment("SaaS");
        IConfiguration configuration = new ConfigurationBuilder().Build();

        bool result = QuickScanSafetyProductionLikeHostClassification.RequiresProductionLikeAnonymousGuardrails(
            hostEnvironment,
            configuration);

        result.Should().BeTrue();
    }

    [Fact]
    public void RequiresProductionLikeAnonymousGuardrails_is_true_when_archlucid_environment_is_production()
    {
        IHostEnvironment hostEnvironment = new TestHostEnvironment(Environments.Development);
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ARCHLUCID_ENVIRONMENT"] = "Production" })
            .Build();

        bool result = QuickScanSafetyProductionLikeHostClassification.RequiresProductionLikeAnonymousGuardrails(
            hostEnvironment,
            configuration);

        result.Should().BeTrue();
    }

    private sealed class TestHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;

        public string ApplicationName { get; set; } = "ArchLucid.Core.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
