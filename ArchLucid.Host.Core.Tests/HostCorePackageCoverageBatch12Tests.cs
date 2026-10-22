using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Validation;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Health;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch12Tests
{
    [Fact]
    public void AskRetrievalSqlFallback_skips_muted_findings_and_prefers_rationale()
    {
        RunDetailDto detail = new()
        {
            GoldenManifest = new ManifestDocument(),
            FindingsSnapshot = new FindingsSnapshot
            {
                Findings =
                [
                    new Finding
                    {
                        Category = "Security",
                        Severity = FindingSeverity.Warning,
                        Title = "Public storage",
                        Rationale = "Blob container allows anonymous network access.",
                        IsMuted = false,
                    },
                    new Finding
                    {
                        Category = "Security",
                        Severity = FindingSeverity.Error,
                        Title = "Muted finding",
                        Rationale = "Should not appear in retrieval context.",
                        IsMuted = true,
                    },
                ],
            },
        };

        string context = AskRetrievalSqlFallback.BuildFromRunDetail(detail, "anonymous network blob storage");

        context.Should().Contain("Blob container");
        context.Should().NotContain("Muted finding");
    }

    [Fact]
    public void AskRetrievalSqlFallback_returns_empty_for_blank_question_or_null_detail()
    {
        AskRetrievalSqlFallback.BuildFromRunDetail(null, "network").Should().BeEmpty();
        AskRetrievalSqlFallback.BuildFromRunDetail(new RunDetailDto(), "   ").Should().BeEmpty();
    }

    [Fact]
    public async Task DetailedHealthCheckResponseWriter_summary_includes_agent_execution_mode()
    {
        DefaultHttpContext httpContext = new();
        httpContext.Response.Body = new MemoryStream();
        HealthReport report = new(
            new Dictionary<string, HealthReportEntry>
            {
                [AgentExecutionModeHealthCheck.RegistrationName] = new(
                    HealthStatus.Healthy,
                    "ok",
                    TimeSpan.FromMilliseconds(1),
                    null,
                    new Dictionary<string, object>
                    {
                        [AgentExecutionModeHealthCheck.ModeDataKey] = "Simulator",
                    }),
            },
            TimeSpan.FromMilliseconds(2));

        await DetailedHealthCheckResponseWriter.WriteAsync(httpContext, report, HealthCheckResponseDetailLevel.Summary);

        httpContext.Response.Body.Position = 0;
        string body = await new StreamReader(httpContext.Response.Body).ReadToEndAsync();
        body.Should().Contain("\"agentExecutionMode\": \"Simulator\"");
    }

    [Fact]
    public async Task DetailedHealthCheckResponseWriter_detailed_payload_includes_version_and_entries()
    {
        DefaultHttpContext httpContext = new();
        httpContext.Response.Body = new MemoryStream();
        HealthReport report = new(
            new Dictionary<string, HealthReportEntry>
            {
                ["sql"] = new(HealthStatus.Healthy, "reachable", TimeSpan.FromMilliseconds(3), null, null),
            },
            TimeSpan.FromMilliseconds(5));

        await DetailedHealthCheckResponseWriter.WriteAsync(httpContext, report);

        httpContext.Response.Body.Position = 0;
        string body = await new StreamReader(httpContext.Response.Body).ReadToEndAsync();
        body.Should().Contain("\"totalDurationMs\"");
        body.Should().Contain("\"version\"");
        body.Should().Contain("\"description\": \"reachable\"");
    }

    [Fact]
    public async Task BlobStorageHealthCheck_unhealthy_when_azure_blob_enabled_without_client()
    {
        ArtifactLargePayloadOptions options = new()
        {
            Enabled = true,
            BlobProvider = "AzureBlob",
            AzureBlobServiceUri = "https://acct.blob.core.windows.net",
        };
        BlobStorageHealthCheck sut = new(
            new TestOptionsMonitor<ArtifactLargePayloadOptions>(options),
            new ServiceCollection().BuildServiceProvider());

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("BlobServiceClient");
    }

    [Fact]
    public async Task SchemaFilesHealthCheck_rejects_rooted_schema_path()
    {
        SchemaValidationOptions options = new()
        {
            AgentResultSchemaPath = @"C:\schemas\agent-result.schema.json",
            GoldenManifestSchemaPath = "schemas/goldenmanifest.schema.json",
            ExplanationRunSchemaPath = "schemas/explanation-run.schema.json",
            ComparisonExplanationSchemaPath = "schemas/comparison-explanation.schema.json",
        };
        SchemaFilesHealthCheck sut = new(Options.Create(options));

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("must be relative");
    }

    [Fact]
    public async Task SchemaFilesHealthCheck_rejects_unix_absolute_schema_path()
    {
        SchemaValidationOptions options = new()
        {
            AgentResultSchemaPath = "schemas/agent-result.schema.json",
            GoldenManifestSchemaPath = "/etc/schemas/goldenmanifest.schema.json",
            ExplanationRunSchemaPath = "schemas/explanation-run.schema.json",
            ComparisonExplanationSchemaPath = "schemas/comparison-explanation.schema.json",
        };
        SchemaFilesHealthCheck sut = new(Options.Create(options));

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("GoldenManifest");
        result.Description.Should().Contain("must be relative");
    }

    [Fact]
    public async Task SchemaFilesHealthCheck_rejects_windows_drive_letter_schema_path()
    {
        SchemaValidationOptions options = new()
        {
            AgentResultSchemaPath = "schemas/agent-result.schema.json",
            GoldenManifestSchemaPath = "schemas/goldenmanifest.schema.json",
            ExplanationRunSchemaPath = "d:\\schemas\\explanation-run.schema.json",
            ComparisonExplanationSchemaPath = "schemas/comparison-explanation.schema.json",
        };
        SchemaFilesHealthCheck sut = new(Options.Create(options));

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("ExplanationRun");
        result.Description.Should().Contain("must be relative");
    }

    [Fact]
    public async Task SchemaFilesHealthCheck_rejects_schema_path_that_escapes_base_directory()
    {
        SchemaValidationOptions options = new()
        {
            AgentResultSchemaPath = "schemas/agent-result.schema.json",
            GoldenManifestSchemaPath = "schemas/goldenmanifest.schema.json",
            ExplanationRunSchemaPath = "schemas/explanation-run.schema.json",
            ComparisonExplanationSchemaPath = "../../../outside/comparison-explanation.schema.json",
        };
        SchemaFilesHealthCheck sut = new(Options.Create(options));

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("ComparisonExplanation");
        result.Description.Should().Contain("escapes the application base directory");
    }

    [Fact]
    public void ContentSafetyConfigurationWarnings_logs_in_production_like_host()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ARCHLUCID_ENVIRONMENT"] = "Production",
                ["ArchLucid:ContentSafety:FailClosedOnSdkError"] = "false",
            })
            .Build();
        TestLogger logger = new();
        IHostEnvironment environment = new TestHostEnvironment { EnvironmentName = Environments.Production };

        ContentSafetyConfigurationWarnings.LogIfProductionLikeFailOpenSdkSettingIsIgnored(
            configuration,
            environment,
            logger);

        logger.Messages.Should().ContainSingle(message =>
            message.Contains("FailClosedOnSdkError", StringComparison.Ordinal));
    }

    [Fact]
    public void ContentSafetyConfigurationWarnings_skips_in_development()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ARCHLUCID_ENVIRONMENT"] = "Development",
                ["ArchLucid:ContentSafety:FailClosedOnSdkError"] = "false",
            })
            .Build();
        TestLogger logger = new();
        IHostEnvironment environment = new TestHostEnvironment { EnvironmentName = Environments.Development };

        ContentSafetyConfigurationWarnings.LogIfProductionLikeFailOpenSdkSettingIsIgnored(
            configuration,
            environment,
            logger);

        logger.Messages.Should().BeEmpty();
    }

    private sealed class TestLogger : ILogger
    {
        public List<string> Messages { get; } = [];

        public IDisposable BeginScope<TState>(TState state) where TState : notnull => NullDisposable.Instance;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            Messages.Add(formatter(state, exception));
        }
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;

        public string ApplicationName { get; set; } = "ArchLucid.Host.Core.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class NullDisposable : IDisposable
    {
        public static readonly NullDisposable Instance = new();

        public void Dispose()
        {
        }
    }

    private sealed class TestOptionsMonitor<T>(T value) : IOptionsMonitor<T>
        where T : class
    {
        public T CurrentValue => value;

        public T Get(string? name) => value;

        public IDisposable OnChange(Action<T, string?> listener) => NullDisposable.Instance;
    }
}
