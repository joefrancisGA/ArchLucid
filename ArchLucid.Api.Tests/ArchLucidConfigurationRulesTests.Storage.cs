using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;
using ArchLucid.Host.Core.Startup.Validation;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]

/// <summary>Storage provider, schema path, and ephemeral InMemory fail-fast rules.</summary>
public sealed partial class ArchLucidConfigurationRulesTests
{
    [SkippableFact]
    public void CollectErrors_WhenProductionAndExplicitInMemoryStorage_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("ArchLucid:StorageProvider=InMemory", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenStagingAndExplicitInMemoryStorage_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Staging);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("ArchLucid:StorageProvider=InMemory", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenDevelopmentAndInMemoryStorage_skips_production_like_ephemeral_storage_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e =>
            e.Contains("must not use ArchLucid:StorageProvider=InMemory", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenDevelopmentAndArchLucidStagingAndInMemory_skips_ephemeral_storage_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ARCHLUCID_ENVIRONMENT"] = "Staging",
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e =>
            e.Contains("must not use ArchLucid:StorageProvider=InMemory", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenDevelopmentAndArchLucidProductionAndInMemory_contains_ephemeral_storage_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ARCHLUCID_ENVIRONMENT"] = "Production",
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.microsoftonline.com/tenant/v2.0",
            ["ArchLucid:ContentSafety:Endpoint"] = "https://content-safety.example",
            ["ArchLucid:ContentSafety:ApiKey"] = "test-key",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("ArchLucid:StorageProvider=InMemory", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenSqlStorageWithoutConnectionString_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql", ["ArchLucidAuth:Mode"] = "DevelopmentBypass"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("ConnectionStrings:ArchLucid", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenInMemoryWithoutConnectionString_is_empty_when_schema_files_exist()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory", ["ArchLucidAuth:Mode"] = "DevelopmentBypass"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().BeEmpty();
    }

    [SkippableFact]
    public void CollectErrors_WhenStorageProviderIsNotInMemoryOrSql_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Blob", ["ArchLucidAuth:Mode"] = "DevelopmentBypass"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("StorageProvider", StringComparison.OrdinalIgnoreCase)
                                     && e.Contains("InMemory", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenSchemaPathIsRooted_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["SchemaValidation:AgentResultSchemaPath"] = "/abs/not-allowed-rooted.schema.json"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("relative", StringComparison.OrdinalIgnoreCase)
                                     && e.Contains("AgentResult", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenSchemaPathEscapesBase_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["SchemaValidation:AgentResultSchemaPath"] = "../outside/agent.schema.json"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("escapes", StringComparison.OrdinalIgnoreCase)
                                     && e.Contains("AgentResult", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenSchemaPathEmpty_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["SchemaValidation:AgentResultSchemaPath"] = "   "
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("AgentResult", StringComparison.OrdinalIgnoreCase)
                                     && e.Contains("missing", StringComparison.OrdinalIgnoreCase));
    }
}
