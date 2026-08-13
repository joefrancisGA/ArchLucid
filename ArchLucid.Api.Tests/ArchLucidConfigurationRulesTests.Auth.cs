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

/// <summary>Auth mode, JWT/API-key, CORS, webhook, MSA External ID, and staging strictness rules.</summary>
public sealed partial class ArchLucidConfigurationRulesTests
{
    [SkippableFact]
    public void CollectErrors_WhenStagingStrictAndJwtWithoutAuthority_contains_fail_fast_rule_prefix()
    {
        Dictionary<string, string?> data = new()
        {
            ["ProductionValidation:Strict"] = "true",
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucid:ContentSafety:Endpoint"] = "https://content-safety.example",
            ["ArchLucid:ContentSafety:ApiKey"] = "test-key",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Staging);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .Contain(e => e.Contains("[jwt_bearer_missing_authority_and_pem]", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenStagingAndJwtWithoutAuthority_skips_fail_without_strict()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucid:ContentSafety:Endpoint"] = "https://content-safety.example",
            ["ArchLucid:ContentSafety:ApiKey"] = "test-key",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Staging);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .NotContain(e => e.Contains("[jwt_bearer_missing_authority_and_pem]", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenStagingAndApiKeyDevelopmentBypassAll_without_strict_contains_fail_fast_rule_prefix()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.microsoftonline.com/tenant/v2.0",
            ["ArchLucid:ContentSafety:Endpoint"] = "https://content-safety.example",
            ["ArchLucid:ContentSafety:ApiKey"] = "test-key",
            ["Authentication:ApiKey:DevelopmentBypassAll"] = "true",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Staging);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .Contain(e =>
                e.Contains("[authentication_api_key_development_bypass_all_disallowed]", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenStagingAndDevelopmentBypass_without_strict_contains_fail_fast_rule_prefix()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["ArchLucid:ContentSafety:Endpoint"] = "https://content-safety.example",
            ["ArchLucid:ContentSafety:ApiKey"] = "test-key",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Staging);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .Contain(e => e.Contains("[auth_mode_development_bypass_disallowed]", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenStagingAndE2eHarnessEnabled_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.microsoftonline.com/tenant/v2.0",
            ["ArchLucid:ContentSafety:Endpoint"] = "https://content-safety.example",
            ["ArchLucid:ContentSafety:ApiKey"] = "test-key",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["ArchLucid:E2eHarness:Enabled"] = "true",
            ["ArchLucid:E2eHarness:SharedSecret"] = "1234567890123456"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Staging);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("E2eHarness", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndDevelopmentBypass_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("DevelopmentBypass", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndAuthModeUnrecognized_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "NotARealMode",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("ArchLucidAuth:Mode", StringComparison.OrdinalIgnoreCase)
                                     && e.Contains("Unrecognized", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndJwtBearerWithoutAuthority_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("Authority", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenDevelopmentAndJwtBearerWithPemMissingIssuer_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:JwtSigningPublicKeyPemPath"] = "/tmp/archlucid-ci-public.pem",
            ["ArchLucidAuth:JwtLocalIssuer"] = "",
            ["ArchLucidAuth:JwtLocalAudience"] = "api://x"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("JwtLocalIssuer", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndJwtBearerWithLocalPem_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:JwtSigningPublicKeyPemPath"] = "/tmp/archlucid-ci-public.pem",
            ["ArchLucidAuth:JwtLocalIssuer"] = "https://ci.local",
            ["ArchLucidAuth:JwtLocalAudience"] = "api://x",
            ["ArchLucidAuth:Authority"] = "",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("JwtSigningPublicKeyPemPath", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndApiKeyModeButKeysDisabled_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "ApiKey",
            ["Authentication:ApiKey:Enabled"] = "false",
            ["Authentication:ApiKey:AdminKey"] = "k",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("Authentication:ApiKey:Enabled", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndApiKeyDevelopmentBypassAll_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.microsoftonline.com/tenant/v2.0",
            ["Authentication:ApiKey:DevelopmentBypassAll"] = "true",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("Authentication:ApiKey:DevelopmentBypassAll", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndApiKeyEnabledWithPlaceholderAdminKey_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:AdminKey"] = "changeme",
            ["Authentication:ApiKey:ReadOnlyKey"] = "",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("Authentication:ApiKey:AdminKey", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndApiKeyEnabledWithPlaceholderReadOnlyKey_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:AdminKey"] = "abcdefghijklmnopqrstuvwxyz123456",
            ["Authentication:ApiKey:ReadOnlyKey"] = "password",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("Authentication:ApiKey:ReadOnlyKey", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionWorkerAndApiKeyEnabledWithPlaceholderAdminKey_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["Hosting:Role"] = "Worker",
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:AdminKey"] = "your-api-key",
            ["Authentication:ApiKey:ReadOnlyKey"] = "",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("Authentication:ApiKey:AdminKey", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenDevelopmentAndApiKeyEnabledWithPlaceholder_does_not_add_production_placeholder_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:AdminKey"] = "changeme",
            ["Authentication:ApiKey:ReadOnlyKey"] = ""
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e =>
            e.Contains("appears to be a placeholder or weak value", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndApiKeyEnabledWithStrongKeys_has_no_placeholder_error()
    {
        const string strongAdmin = "a7f3c9e2b1d80456n8m0k2j4h6g8f0e2";
        const string strongReader = "b8g4d0f3c2e90567o9n1l3k5i7h9g1f3";

        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:AdminKey"] = strongAdmin,
            ["Authentication:ApiKey:ReadOnlyKey"] = strongReader,
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e =>
            e.Contains("appears to be a placeholder or weak value", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndApiKeyEnabledWithTwentyCharAdminKey_has_no_placeholder_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:AdminKey"] = "aB3$xK9mN2pQ7wR5vZ1y",
            ["Authentication:ApiKey:ReadOnlyKey"] = "",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e =>
            e.Contains("appears to be a placeholder or weak value", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndApiKeyEnabledWithReadOnlyKeyTest_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:AdminKey"] = "aB3$xK9mN2pQ7wR5vZ1yabcdefghijklmnopqrst",
            ["Authentication:ApiKey:ReadOnlyKey"] = "test",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("Authentication:ApiKey:ReadOnlyKey", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndApiKeyDisabled_weakAdminKey_does_not_add_placeholder_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Authentication:ApiKey:Enabled"] = "false",
            ["Authentication:ApiKey:AdminKey"] = "test",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e =>
            e.Contains("appears to be a placeholder or weak value", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenDevelopmentAndDevelopmentBypassAndInMemory_is_empty_when_schema_files_exist()
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
    public void CollectErrors_WhenProductionAndCorsOriginsEmpty_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("Cors:AllowedOrigins", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndHostingRoleWorker_does_not_require_cors_origins()
    {
        Dictionary<string, string?> data = new()
        {
            ["Hosting:Role"] = "Worker",
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e => e.Contains("Cors:AllowedOrigins", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndCorsWildcard_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Cors:AllowedOrigins:0"] = "*",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("wildcard", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndWebhookHttpWithoutSecret_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "true",
            ["WebhookDelivery:HmacSha256SharedSecret"] = ""
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("WebhookDelivery:HmacSha256SharedSecret", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndWebhookSecretTooShort_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "true",
            ["WebhookDelivery:HmacSha256SharedSecret"] = "short-secret-not-32-chars"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("WebhookDelivery:HmacSha256SharedSecret", StringComparison.OrdinalIgnoreCase) &&
            e.Contains("32", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenApiKeyEnabledButNoKeysConfigured_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:AdminKey"] = "",
            ["Authentication:ApiKey:ReadOnlyKey"] = ""
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("Authentication:ApiKey:Enabled is true", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionApiKeyModeButBothKeysMissing_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "ApiKey",
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:AdminKey"] = "",
            ["Authentication:ApiKey:ReadOnlyKey"] = "",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("Production ApiKey auth requires", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionApiKeyModeWithoutTenantId_contains_scope_binding_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "ApiKey",
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:AdminKey"] = "abcdefghijklmnopqrstuvwxyz1234567890abcd",
            ["Authentication:ApiKey:ReadOnlyKey"] = "",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("Authentication:ApiKey:TenantId", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionApiKeyModeWithTenantId_has_no_scope_binding_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "ApiKey",
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:AdminKey"] = "abcdefghijklmnopqrstuvwxyz1234567890abcd",
            ["Authentication:ApiKey:TenantId"] = "11111111-1111-1111-1111-111111111111",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e => e.Contains("Authentication:ApiKey:TenantId", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndRequireJwtBearerInProductionWithApiKey_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "ApiKey",
            ["ArchLucidAuth:RequireJwtBearerInProduction"] = "true",
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:AdminKey"] = "abcdefghijklmnopqrstuvwxyz1234567890abcd",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("RequireJwtBearerInProduction", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void
        CollectErrors_WhenProductionAndRequireJwtBearerInProductionWithJwtBearer_allows_when_authority_configured()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:RequireJwtBearerInProduction"] = "true",
            ["ArchLucidAuth:Authority"] = "https://login.microsoftonline.com/tenant/v2.0",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e => e.Contains("RequireJwtBearerInProduction", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndMsaExternalIdWithoutExternalIdTenantId_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.microsoftonline.com/common/v2.0",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["Auth:Trial:Modes:0"] = "MsaExternalId",
            ["Auth:Trial:ExternalIdTenantId"] = ""
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("ExternalIdTenantId", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndMsaExternalIdWithExternalIdTenantId_allows()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.microsoftonline.com/common/v2.0",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["Auth:Trial:Modes:0"] = "MsaExternalId",
            ["Auth:Trial:ExternalIdTenantId"] = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e => e.Contains("ExternalIdTenantId", StringComparison.OrdinalIgnoreCase));
    }
}
