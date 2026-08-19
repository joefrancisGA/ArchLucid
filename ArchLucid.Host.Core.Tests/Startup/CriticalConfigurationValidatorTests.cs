using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Startup.Validation;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

using Moq;

namespace ArchLucid.Host.Core.Tests.Startup;

[Trait("Category", "Unit")]
public sealed class CriticalConfigurationValidatorTests
{
    [Fact]
    public void CollectErrors_is_empty_when_simulator_mode_and_connection_string_present()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:ArchLucid"] =
                    "Server=.;Database=CriticalConfigurationValidatorTests;Trusted_Connection=True;TrustServerCertificate=True",
                ["AgentExecution:Mode"] = "Simulator",
            });

        IReadOnlyList<string> errors = CriticalConfigurationValidator.CollectErrors(configuration);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void CollectErrors_reports_missing_connection_string_when_storage_is_sql()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?>
            {
                ["ArchLucid:StorageProvider"] = "Sql",
                ["AgentExecution:Mode"] = "Simulator",
            });

        IReadOnlyList<string> errors = CriticalConfigurationValidator.CollectErrors(configuration);

        errors.Should().ContainSingle(error => error.Contains("ConnectionStrings:ArchLucid", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectErrors_skips_connection_string_when_storage_is_in_memory()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?>
            {
                ["ArchLucid:StorageProvider"] = "InMemory",
                ["AgentExecution:Mode"] = "Simulator",
            });

        IReadOnlyList<string> errors = CriticalConfigurationValidator.CollectErrors(configuration);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void CollectErrors_reports_missing_azure_openai_when_real_mode()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:ArchLucid"] =
                    "Server=.;Database=CriticalConfigurationValidatorTests;Trusted_Connection=True;TrustServerCertificate=True",
                ["AgentExecution:Mode"] = "Real",
            });

        IReadOnlyList<string> errors = CriticalConfigurationValidator.CollectErrors(configuration);

        errors.Should().ContainSingle(error =>
            error.Contains("Azure OpenAI is incomplete", StringComparison.Ordinal)
            && error.Contains("AzureOpenAI:Endpoint", StringComparison.Ordinal)
            && error.Contains("AzureOpenAI:ApiKey", StringComparison.Ordinal)
            && error.Contains("AzureOpenAI:DeploymentName", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectErrors_skips_api_key_when_real_mode_uses_managed_identity()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:ArchLucid"] =
                    "Server=.;Database=CriticalConfigurationValidatorTests;Trusted_Connection=True;TrustServerCertificate=True",
                ["AgentExecution:Mode"] = "Real",
                ["AzureOpenAI:Endpoint"] = "https://resource.openai.azure.com/",
                ["AzureOpenAI:DeploymentName"] = "gpt",
                ["AzureOpenAI:AuthenticationMode"] = "ManagedIdentity",
            });

        IReadOnlyList<string> errors = CriticalConfigurationValidator.CollectErrors(configuration);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void CollectErrors_skips_azure_openai_when_real_mode_uses_echo_client()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:ArchLucid"] =
                    "Server=.;Database=CriticalConfigurationValidatorTests;Trusted_Connection=True;TrustServerCertificate=True",
                ["AgentExecution:Mode"] = "Real",
                ["AgentExecution:CompletionClient"] = "Echo",
            });

        IReadOnlyList<string> errors = CriticalConfigurationValidator.CollectErrors(configuration);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void CollectErrors_reports_demo_enabled_on_production_profile()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:ArchLucid"] =
                    "Server=.;Database=CriticalConfigurationValidatorTests;Trusted_Connection=True;TrustServerCertificate=True",
                ["AgentExecution:Mode"] = "Simulator",
                ["Demo:Enabled"] = "true",
                ["ASPNETCORE_ENVIRONMENT"] = "Production",
            });

        IReadOnlyList<string> errors = CriticalConfigurationValidator.CollectErrors(configuration);

        errors.Should().ContainSingle(error => error.Contains("Demo:Enabled", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectErrors_reports_anonymous_viewer_on_production_profile()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:ArchLucid"] =
                    "Server=.;Database=CriticalConfigurationValidatorTests;Trusted_Connection=True;TrustServerCertificate=True",
                ["AgentExecution:Mode"] = "Simulator",
                ["Demo:AnonymousViewer:Enabled"] = "true",
                ["ASPNETCORE_ENVIRONMENT"] = "Production",
            });

        IReadOnlyList<string> errors = CriticalConfigurationValidator.CollectErrors(configuration);

        errors.Should().ContainSingle(error => error.Contains("Demo:AnonymousViewer:Enabled", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectErrors_allows_demo_enabled_when_not_production_profile()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:ArchLucid"] =
                    "Server=.;Database=CriticalConfigurationValidatorTests;Trusted_Connection=True;TrustServerCertificate=True",
                ["AgentExecution:Mode"] = "Simulator",
                ["Demo:Enabled"] = "true",
                ["ASPNETCORE_ENVIRONMENT"] = "Development",
            });

        IReadOnlyList<string> errors = CriticalConfigurationValidator.CollectErrors(configuration);

        errors.Should().NotContain(error => error.Contains("Demo:Enabled", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectErrors_reports_demo_enabled_when_host_environment_is_production()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:ArchLucid"] =
                    "Server=.;Database=CriticalConfigurationValidatorTests;Trusted_Connection=True;TrustServerCertificate=True",
                ["AgentExecution:Mode"] = "Simulator",
                ["Demo:Enabled"] = "true",
            });

        Mock<IHostEnvironment> environment = new();
        environment.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors =
            CriticalConfigurationValidator.CollectErrors(configuration, environment.Object);

        errors.Should().ContainSingle(error => error.Contains("Demo:Enabled", StringComparison.Ordinal));
    }

    [Fact]
    public void StartAsync_throws_descriptive_invalid_operation_exception_when_configuration_invalid()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?>
            {
                ["ArchLucid:StorageProvider"] = "Sql",
                ["AgentExecution:Mode"] = "Real",
            });

        Mock<IHostEnvironment> environment = new();
        environment.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        ConfigurationValidationHostedService hostedService = new(
            configuration,
            environment.Object,
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ConfigurationValidationHostedService>.Instance);

        Func<Task> act = () => hostedService.StartAsync(CancellationToken.None);

        act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*ConnectionStrings:ArchLucid*")
            .WithMessage("*Azure OpenAI is incomplete*");
    }

    private static IConfiguration BuildConfiguration(IReadOnlyDictionary<string, string?> values) =>
        new ConfigurationBuilder().AddInMemoryCollection(values).Build();
}
