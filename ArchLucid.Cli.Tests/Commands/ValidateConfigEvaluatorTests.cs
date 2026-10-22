using ArchLucid.Cli.Commands;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Tests.Commands;

[Trait("Suite", "Configuration")]
public sealed class ValidateConfigEvaluatorTests
{
    private const string ContentRoot = "/tmp/archlucid-validate-config-tests";

    [Fact]
    public void Evaluate_throws_for_null_configuration()
    {
        Action act = () => ValidateConfigEvaluator.Evaluate(null!, ContentRoot, appsettingsExists: true);

        act.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void Evaluate_throws_for_missing_content_root(string? contentRoot)
    {
        IConfiguration configuration = BuildConfiguration([]);

        Action act = () => ValidateConfigEvaluator.Evaluate(configuration, contentRoot!, appsettingsExists: true);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Evaluate_reports_appsettings_present()
    {
        IReadOnlyList<ValidateConfigFinding> findings = Evaluate([], appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "appsettings.json" && f.Severity == ValidateConfigFindingSeverity.Ok);
    }

    [Fact]
    public void Evaluate_reports_appsettings_missing_as_warning()
    {
        IReadOnlyList<ValidateConfigFinding> findings = Evaluate([], appsettingsExists: false);

        findings.Should().Contain(f =>
            f.Check == "appsettings.json" && f.Severity == ValidateConfigFindingSeverity.Warning);
    }

    [Fact]
    public void Evaluate_reports_hosting_environment_from_configuration_key()
    {
        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(
            new Dictionary<string, string?> { ["ASPNETCORE_ENVIRONMENT"] = "Staging" },
            appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "Hosting environment key" && f.Detail == "Staging");
    }

    [Theory]
    [InlineData(null, null, "Error")]
    [InlineData(null, "Server=.;Database=ArchLucid;", "Ok")]
    [InlineData(null, "not-a-sql-string", "Warning")]
    [InlineData("Sql", null, "Error")]
    [InlineData("sql", "Data Source=.;Database=ArchLucid;", "Ok")]
    public void Evaluate_reports_connection_string_severity_for_sql_storage(
        string? storageProvider,
        string? connectionString,
        string expected)
    {
        Dictionary<string, string?> settings = [];

        if (storageProvider is not null)
            settings["ArchLucid:StorageProvider"] = storageProvider;

        if (connectionString is not null)
            settings["ConnectionStrings:ArchLucid"] = connectionString;

        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(settings, appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "ConnectionStrings:ArchLucid" && f.Severity.ToString() == expected);
    }

    [Fact]
    public void Evaluate_reports_in_memory_storage_skips_connection_string()
    {
        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(
            new Dictionary<string, string?> { ["ArchLucid:StorageProvider"] = "InMemory" },
            appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "ConnectionStrings:ArchLucid"
            && f.Severity == ValidateConfigFindingSeverity.Ok
            && f.Detail.Contains("InMemory"));
    }

    [Fact]
    public void Evaluate_reports_unrecognized_storage_provider_as_error()
    {
        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(
            new Dictionary<string, string?> { ["ArchLucid:StorageProvider"] = "Postgres" },
            appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "ArchLucid:StorageProvider" && f.Severity == ValidateConfigFindingSeverity.Error);
    }

    [Theory]
    [InlineData(null, "Warning")]
    [InlineData("Bogus", "Error")]
    [InlineData("Simulator", "Ok")]
    [InlineData("Real", "Ok")]
    public void Evaluate_reports_agent_execution_mode_severity(string? mode, string expected)
    {
        Dictionary<string, string?> settings = [];

        if (mode is not null)
            settings["AgentExecution:Mode"] = mode;

        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(settings, appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "AgentExecution:Mode" && f.Severity.ToString() == expected);
    }

    [Theory]
    [InlineData(null, "Ok")]
    [InlineData("Echo", "Ok")]
    [InlineData("AzureOpenAi", "Ok")]
    [InlineData("Bogus", "Error")]
    public void Evaluate_reports_completion_client_severity(string? completionClient, string expected)
    {
        Dictionary<string, string?> settings = [];

        if (completionClient is not null)
            settings["AgentExecution:CompletionClient"] = completionClient;

        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(settings, appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "AgentExecution:CompletionClient" && f.Severity.ToString() == expected);
    }

    [Theory]
    [InlineData(-1, "Error")]
    [InlineData(300_000, "Error")]
    [InlineData(0, "Ok")]
    [InlineData(2048, "Ok")]
    public void Evaluate_reports_max_completion_tokens_severity(int value, string expected)
    {
        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(
            new Dictionary<string, string?> { ["AzureOpenAI:MaxCompletionTokens"] = value.ToString() },
            appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "AzureOpenAI:MaxCompletionTokens" && f.Severity.ToString() == expected);
    }

    [Theory]
    [InlineData(null, "Ok")]
    [InlineData("Bogus", "Error")]
    [InlineData("ApiKey", "Ok")]
    [InlineData("DevelopmentBypass", "Ok")]
    public void Evaluate_reports_auth_mode_severity(string? authMode, string expected)
    {
        Dictionary<string, string?> settings = [];

        if (authMode is not null)
            settings["ArchLucidAuth:Mode"] = authMode;

        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(settings, appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "ArchLucidAuth:Mode" && f.Severity.ToString() == expected);
    }

    [Fact]
    public void Evaluate_skips_oidc_metadata_when_auth_mode_is_not_jwt_bearer()
    {
        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(
            new Dictionary<string, string?> { ["ArchLucidAuth:Mode"] = "ApiKey" },
            appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "OIDC metadata (Authority / Audience)" && f.Severity == ValidateConfigFindingSeverity.Ok);
    }

    [Fact]
    public void Evaluate_reports_missing_local_issuer_and_audience_for_pem_signing()
    {
        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(
            new Dictionary<string, string?>
            {
                ["ArchLucidAuth:Mode"] = "JwtBearer",
                ["ArchLucidAuth:JwtSigningPublicKeyPemPath"] = "/tmp/key.pem",
            },
            appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "ArchLucidAuth:JwtLocalIssuer" && f.Severity == ValidateConfigFindingSeverity.Error);
        findings.Should().Contain(f =>
            f.Check == "ArchLucidAuth:JwtLocalAudience" && f.Severity == ValidateConfigFindingSeverity.Error);
    }

    [Fact]
    public void Evaluate_reports_local_issuer_and_audience_present_for_pem_signing()
    {
        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(
            new Dictionary<string, string?>
            {
                ["ArchLucidAuth:Mode"] = "JwtBearer",
                ["ArchLucidAuth:JwtSigningPublicKeyPemPath"] = "/tmp/key.pem",
                ["ArchLucidAuth:JwtLocalIssuer"] = "archlucid-local",
                ["ArchLucidAuth:JwtLocalAudience"] = "archlucid-api",
            },
            appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "ArchLucidAuth:JwtLocalIssuer" && f.Severity == ValidateConfigFindingSeverity.Ok);
        findings.Should().Contain(f =>
            f.Check == "ArchLucidAuth:JwtLocalAudience" && f.Severity == ValidateConfigFindingSeverity.Ok);
    }

    [Theory]
    [InlineData(null, "Error")]
    [InlineData("not-a-uri", "Error")]
    [InlineData("http://issuer.example.com", "Error")]
    [InlineData("https://issuer.example.com", "Ok")]
    public void Evaluate_reports_oidc_authority_severity_without_pem(string? authority, string expected)
    {
        Dictionary<string, string?> settings = new() { ["ArchLucidAuth:Mode"] = "JwtBearer" };

        if (authority is not null)
            settings["ArchLucidAuth:Authority"] = authority;

        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(settings, appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "ArchLucidAuth:Authority" && f.Severity.ToString() == expected);
    }

    [Theory]
    [InlineData(null, "Error")]
    [InlineData("archlucid-api", "Ok")]
    public void Evaluate_reports_oidc_audience_severity_without_pem(string? audience, string expected)
    {
        Dictionary<string, string?> settings = new()
        {
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://issuer.example.com",
        };

        if (audience is not null)
            settings["ArchLucidAuth:Audience"] = audience;

        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(settings, appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "ArchLucidAuth:Audience" && f.Severity.ToString() == expected);
    }

    [Fact]
    public void Evaluate_reports_api_key_disabled_as_ok()
    {
        IReadOnlyList<ValidateConfigFinding> findings = Evaluate([], appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "Authentication:ApiKey" && f.Severity == ValidateConfigFindingSeverity.Ok);
    }

    [Fact]
    public void Evaluate_reports_api_key_enabled_without_keys_as_error()
    {
        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(
            new Dictionary<string, string?> { ["Authentication:ApiKey:Enabled"] = "true" },
            appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "Authentication:ApiKey key material" && f.Severity == ValidateConfigFindingSeverity.Error);
    }

    [Theory]
    [InlineData("Authentication:ApiKey:AdminKey")]
    [InlineData("Authentication:ApiKey:ReadOnlyKey")]
    public void Evaluate_reports_api_key_enabled_with_one_key_present_as_ok(string keyPath)
    {
        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(
            new Dictionary<string, string?>
            {
                ["Authentication:ApiKey:Enabled"] = "true",
                [keyPath] = "sample-key-value",
            },
            appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "Authentication:ApiKey key material" && f.Severity == ValidateConfigFindingSeverity.Ok);
    }

    [Fact]
    public void Evaluate_skips_azure_openai_rules_when_agent_mode_is_not_real()
    {
        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(
            new Dictionary<string, string?> { ["AgentExecution:Mode"] = "Simulator" },
            appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "AzureOpenAI:*" && f.Detail.Contains("AgentExecution:Mode is not Real"));
    }

    [Fact]
    public void Evaluate_skips_azure_openai_rules_when_completion_client_is_echo()
    {
        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(
            new Dictionary<string, string?>
            {
                ["AgentExecution:Mode"] = "Real",
                ["AgentExecution:CompletionClient"] = "Echo",
            },
            appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "AzureOpenAI:*" && f.Detail.Contains("Echo completion client"));
    }

    [Theory]
    [InlineData(null, "Error")]
    [InlineData("not-a-uri", "Error")]
    [InlineData("https://my-resource.openai.azure.com", "Ok")]
    public void Evaluate_reports_azure_openai_endpoint_severity_in_real_mode(string? endpoint, string expected)
    {
        Dictionary<string, string?> settings = new()
        {
            ["AgentExecution:Mode"] = "Real",
            ["AgentExecution:CompletionClient"] = "AzureOpenAi",
        };

        if (endpoint is not null)
            settings["AzureOpenAI:Endpoint"] = endpoint;

        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(settings, appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "AzureOpenAI:Endpoint" && f.Severity.ToString() == expected);
    }

    [Theory]
    [InlineData(null, "Error")]
    [InlineData("sample-api-key", "Ok")]
    public void Evaluate_reports_azure_openai_api_key_severity_in_real_mode(string? apiKey, string expected)
    {
        Dictionary<string, string?> settings = new()
        {
            ["AgentExecution:Mode"] = "Real",
            ["AgentExecution:CompletionClient"] = "AzureOpenAi",
            ["AzureOpenAI:Endpoint"] = "https://my-resource.openai.azure.com",
        };

        if (apiKey is not null)
            settings["AzureOpenAI:ApiKey"] = apiKey;

        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(settings, appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "AzureOpenAI:ApiKey" && f.Severity.ToString() == expected);
    }

    [Theory]
    [InlineData(null, "Error")]
    [InlineData("gpt-4o", "Ok")]
    public void Evaluate_reports_azure_openai_deployment_name_severity_in_real_mode(string? deployment, string expected)
    {
        Dictionary<string, string?> settings = new()
        {
            ["AgentExecution:Mode"] = "Real",
            ["AgentExecution:CompletionClient"] = "AzureOpenAi",
            ["AzureOpenAI:Endpoint"] = "https://my-resource.openai.azure.com",
            ["AzureOpenAI:ApiKey"] = "sample-api-key",
        };

        if (deployment is not null)
            settings["AzureOpenAI:DeploymentName"] = deployment;

        IReadOnlyList<ValidateConfigFinding> findings = Evaluate(settings, appsettingsExists: true);

        findings.Should().Contain(f =>
            f.Check == "AzureOpenAI:DeploymentName" && f.Severity.ToString() == expected);
    }

    private static IReadOnlyList<ValidateConfigFinding> Evaluate(
        Dictionary<string, string?> settings,
        bool appsettingsExists)
    {
        return ValidateConfigEvaluator.Evaluate(BuildConfiguration(settings), ContentRoot, appsettingsExists);
    }

    private static IConfiguration BuildConfiguration(Dictionary<string, string?> settings)
    {
        return new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
    }
}
