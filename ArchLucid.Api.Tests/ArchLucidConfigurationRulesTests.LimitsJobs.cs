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

/// <summary>Rate limits, batch bounds, archival, durable jobs, outbox, and retrieval index rules.</summary>
public sealed partial class ArchLucidConfigurationRulesTests
{
    [SkippableFact]
    public void CollectErrors_WhenTransactionalOutboxEnabledWithInMemory_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["IntegrationEvents:TransactionalOutboxEnabled"] = "true",
            ["LlmCompletionCache:Enabled"] = "false",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("TransactionalOutboxEnabled", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void
        CollectErrors_WhenLlmCompletionCacheDistributedAndHotPathRedisConfigured_has_no_distributed_redis_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=x;Trusted_Connection=True;TrustServerCertificate=True",
            ["LlmCompletionCache:Enabled"] = "true",
            ["LlmCompletionCache:Provider"] = "Distributed",
            ["HotPathCache:Enabled"] = "true",
            ["HotPathCache:Provider"] = "Redis",
            ["HotPathCache:RedisConnectionString"] = "localhost:6379",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .NotContain(e => e.Contains(
                "LlmCompletionCache:Provider Distributed requires",
                StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenDurableJobsAndProcessorReceiveBatchSizeInvalid_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=x;Trusted_Connection=True;TrustServerCertificate=True",
            ["BackgroundJobs:Mode"] = "Durable",
            ["BackgroundJobs:ResultsContainerName"] = "background-job-results",
            ["BackgroundJobs:ProcessorReceiveBatchSize"] = "99",
            ["ArtifactLargePayload:BlobProvider"] = "AzureBlob",
            ["ArtifactLargePayload:AzureBlobServiceUri"] = "https://st.blob.core.windows.net",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("ProcessorReceiveBatchSize", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenBatchMaxBelowMinimum_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["ComparisonReplay:Batch:MaxComparisonRecordIds"] = "0"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("ComparisonReplay:Batch:MaxComparisonRecordIds", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenDeprecationEnabledAndSunsetUnparseable_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["ApiDeprecation:Enabled"] = "true",
            ["ApiDeprecation:SunsetHttpDate"] = "not-a-date"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("ApiDeprecation:SunsetHttpDate", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenDataArchivalIntervalInvalid_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["DataArchival:IntervalHours"] = "0"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("DataArchival:IntervalHours", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenRateLimitingFixedWindowPermitLimitNegative_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["RateLimiting:FixedWindow:PermitLimit"] = "-1"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("RateLimiting:FixedWindow", StringComparison.OrdinalIgnoreCase)
                                     && e.Contains("PermitLimit", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenRateLimitingExpensiveWindowMinutesZero_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["RateLimiting:Expensive:WindowMinutes"] = "0"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("RateLimiting:Expensive", StringComparison.OrdinalIgnoreCase)
                                     && e.Contains("WindowMinutes", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenRetrievalVectorIndexInvalid_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["Retrieval:VectorIndex"] = "Elastic"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("Retrieval:VectorIndex", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenRateLimitingReplayLightQueueLimitNegative_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["RateLimiting:Replay:Light:PermitLimit"] = "10",
            ["RateLimiting:Replay:Light:WindowMinutes"] = "1",
            ["RateLimiting:Replay:Light:QueueLimit"] = "-1"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("RateLimiting:Replay:Light", StringComparison.OrdinalIgnoreCase)
                                     && e.Contains("QueueLimit", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenRetrievalEmbeddingCapsInvalid_contains_errors()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["Retrieval:EmbeddingCaps:MaxTextsPerEmbeddingRequest"] = "0",
            ["Retrieval:EmbeddingCaps:MaxChunksPerIndexOperation"] = "2000000"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("Retrieval:EmbeddingCaps:MaxTextsPerEmbeddingRequest", StringComparison.OrdinalIgnoreCase));
        errors.Should().Contain(e =>
            e.Contains("Retrieval:EmbeddingCaps:MaxChunksPerIndexOperation", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenDataArchivalRunsRetentionOutOfRange_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["DataArchival:RunsRetentionDays"] = "-5"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("DataArchival:RunsRetentionDays", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenBatchReplayMaxIdsAbove500_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["ComparisonReplay:Batch:MaxComparisonRecordIds"] = "501"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("ComparisonReplay:Batch:MaxComparisonRecordIds", StringComparison.OrdinalIgnoreCase));
    }
}
