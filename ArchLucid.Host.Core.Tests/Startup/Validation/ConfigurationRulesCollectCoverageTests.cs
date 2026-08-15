using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Startup.Validation.Rules;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Tests.Startup.Validation;

/// <summary>Unit coverage for startup <c>Collect</c> validation rules that lack dedicated test files.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ConfigurationRulesCollectCoverageTests
{
    [Fact]
    public void RateLimitingRules_rejects_invalid_fixed_window_limits()
    {
        Dictionary<string, string?> settings = new()
        {
            ["RateLimiting:FixedWindow:PermitLimit"] = "0",
            ["RateLimiting:FixedWindow:WindowMinutes"] = "0",
            ["RateLimiting:FixedWindow:QueueLimit"] = "-1",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        RateLimitingRules.Collect(configuration, errors);

        errors.Should().Contain(e => e.Contains("RateLimiting:FixedWindow:PermitLimit", StringComparison.Ordinal));
        errors.Should().Contain(e => e.Contains("RateLimiting:FixedWindow:WindowMinutes", StringComparison.Ordinal));
        errors.Should().Contain(e => e.Contains("RateLimiting:FixedWindow:QueueLimit", StringComparison.Ordinal));
    }

    [Fact]
    public void LlmTokenQuotaRules_rejects_enabled_without_positive_limits()
    {
        Dictionary<string, string?> settings = new()
        {
            ["LlmTokenQuota:Enabled"] = "true",
            ["LlmTokenQuota:WindowMinutes"] = "0",
            ["LlmTokenQuota:MaxPromptTokensPerTenantPerWindow"] = "0",
            ["LlmTokenQuota:MaxCompletionTokensPerTenantPerWindow"] = "0",
            ["LlmTokenQuota:AssumedMaxPromptTokensPerRequest"] = "0",
            ["LlmTokenQuota:AssumedMaxCompletionTokensPerRequest"] = "0",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        LlmTokenQuotaRules.Collect(configuration, errors);

        errors.Should().HaveCountGreaterThanOrEqualTo(4);
    }

    [Fact]
    public void LlmDailyTenantBudgetRules_rejects_invalid_enabled_settings()
    {
        Dictionary<string, string?> settings = new()
        {
            ["LlmDailyTenantBudget:Enabled"] = "true",
            ["LlmDailyTenantBudget:HardCutoffTokensPerUtcDay"] = "0",
            ["LlmDailyTenantBudget:WarnFraction"] = "0",
            ["LlmDailyTenantBudget:AssumedMaxTotalTokensPerRequest"] = "0",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        LlmDailyTenantBudgetRules.Collect(configuration, errors);

        errors.Should().HaveCount(3);
    }

    [Fact]
    public void LlmMonthlyTenantDollarBudgetRules_rejects_cost_estimation_disabled()
    {
        Dictionary<string, string?> settings = new()
        {
            ["LlmMonthlyTenantDollarBudget:Enabled"] = "true",
            ["AgentExecution:LlmCostEstimation:Enabled"] = "false",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        LlmMonthlyTenantDollarBudgetRules.Collect(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("LlmCostEstimation:Enabled", StringComparison.Ordinal));
    }

    [Fact]
    public void LlmCompletionCacheRules_rejects_invalid_distributed_provider_without_redis()
    {
        Dictionary<string, string?> settings = new()
        {
            ["LlmCompletionCache:Enabled"] = "true",
            ["LlmCompletionCache:Provider"] = "Distributed",
            ["LlmCompletionCache:MaxEntries"] = "0",
            ["LlmCompletionCache:AbsoluteExpirationSeconds"] = "0",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        LlmCompletionCacheRules.Collect(configuration, errors);

        errors.Should().Contain(e => e.Contains("RedisConnectionString", StringComparison.Ordinal));
        errors.Should().Contain(e => e.Contains("MaxEntries", StringComparison.Ordinal));
    }

    [Fact]
    public void HostLeaderElectionRules_rejects_renew_interval_not_less_than_lease()
    {
        Dictionary<string, string?> settings = new()
        {
            ["HostLeaderElection:Enabled"] = "true",
            ["HostLeaderElection:LeaseDurationSeconds"] = "30",
            ["HostLeaderElection:RenewIntervalSeconds"] = "30",
            ["HostLeaderElection:FollowerPollMilliseconds"] = "50",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        HostLeaderElectionRules.Collect(configuration, errors);

        errors.Should().Contain(e => e.Contains("RenewIntervalSeconds", StringComparison.Ordinal));
        errors.Should().Contain(e => e.Contains("FollowerPollMilliseconds", StringComparison.Ordinal));
    }

    [Fact]
    public void DataArchivalRules_rejects_invalid_retention_and_batch_sizes()
    {
        Dictionary<string, string?> settings = new()
        {
            ["DataArchival:RunsRetentionDays"] = "-1",
            ["DataArchival:PurgeArchivedAgentExecutionTracesAfterDays"] = "10",
            ["DataArchival:PurgeArchivedAgentExecutionTracesBatchSize"] = "0",
            ["DataArchival:IntervalHours"] = "0",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        DataArchivalRules.Collect(configuration, errors);

        errors.Should().HaveCountGreaterThanOrEqualTo(3);
    }

    [Fact]
    public void ContextIngestionRules_rejects_non_positive_payload_bytes()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ArchLucid:ArchitectureRunCreation:MaxPayloadBytes"] = "0",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        ContextIngestionRules.Collect(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("MaxPayloadBytes", StringComparison.Ordinal));
    }

    [Fact]
    public void RetrievalRules_rejects_invalid_embedding_caps_and_vector_index()
    {
        Dictionary<string, string?> settings = new()
        {
            ["Retrieval:EmbeddingCaps:MaxTextsPerEmbeddingRequest"] = "0",
            ["Retrieval:EmbeddingCaps:MaxChunksPerIndexOperation"] = "-1",
            ["Retrieval:VectorIndex"] = "Elastic",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        RetrievalRules.CollectEmbeddingCaps(configuration, errors);
        RetrievalRules.CollectVectorIndex(configuration, errors);

        errors.Should().HaveCount(3);
    }

    [Fact]
    public void AgentExecutionRules_rejects_invalid_mode_and_missing_azure_openai()
    {
        Dictionary<string, string?> settings = new()
        {
            ["AgentExecution:Mode"] = "Hybrid",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        AgentExecutionRules.Collect(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("AgentExecution:Mode", StringComparison.Ordinal));
    }

    [Fact]
    public void AgentExecutionRules_real_mode_requires_azure_openai_settings()
    {
        Dictionary<string, string?> settings = new()
        {
            ["AgentExecution:Mode"] = "Real",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        AgentExecutionRules.Collect(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("Azure OpenAI", StringComparison.Ordinal));
    }

    [Fact]
    public void AgentExecutionRules_log_information_when_real_mode_fully_configured()
    {
        Dictionary<string, string?> settings = new()
        {
            ["AgentExecution:Mode"] = "Real",
            ["AzureOpenAI:Endpoint"] = "https://example.openai.azure.com/",
            ["AzureOpenAI:ApiKey"] = "key",
            ["AzureOpenAI:DeploymentName"] = "gpt",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> messages = [];
        CollectingLogger<object> logger = new(messages);

        AgentExecutionRules.LogInformationWhenRealModeConfigured(configuration, logger);

        messages.Should().ContainSingle(m => m.Contains("Real", StringComparison.Ordinal));
    }

    [Fact]
    public void BatchReplayRules_rejects_out_of_range_comparison_record_ids()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ComparisonReplay:Batch:MaxComparisonRecordIds"] = "0",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        BatchReplayRules.Collect(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("MaxComparisonRecordIds", StringComparison.Ordinal));
    }

    [Fact]
    public void BackgroundJobsRules_durable_mode_requires_sql_and_blob_settings()
    {
        Dictionary<string, string?> settings = new()
        {
            ["BackgroundJobs:Mode"] = "Durable",
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArtifactLargePayload:BlobProvider"] = "Local",
            ["BackgroundJobs:ProcessorReceiveBatchSize"] = "0",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        BackgroundJobsRules.Collect(configuration, errors);

        errors.Should().HaveCountGreaterThanOrEqualTo(3);
    }

    [Fact]
    public void StorageRules_rejects_invalid_provider_and_missing_sql_connection()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ArchLucid:StorageProvider"] = "Cosmos",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        ArchLucidOptions options = new() { StorageProvider = "Cosmos" };
        List<string> errors = [];

        StorageRules.Collect(configuration, options, errors);

        errors.Should().ContainSingle(e => e.Contains("StorageProvider", StringComparison.Ordinal));
    }

    [Fact]
    public void ApiDeprecationRules_rejects_unparseable_sunset_date()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ApiDeprecation:Enabled"] = "true",
            ["ApiDeprecation:SunsetHttpDate"] = "not-a-date",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        ApiDeprecationRules.Collect(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("SunsetHttpDate", StringComparison.Ordinal));
    }

    [Fact]
    public void ObservabilityRules_rejects_enabled_otlp_without_endpoint_and_invalid_protocol()
    {
        Dictionary<string, string?> settings = new()
        {
            ["Observability:Otlp:Enabled"] = "true",
            ["Observability:Otlp:Protocol"] = "Udp",
            ["Observability:Prometheus:Enabled"] = "true",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        ObservabilityRules.CollectOtlp(configuration, errors);
        ObservabilityRules.CollectPrometheus(configuration, errors);

        errors.Should().HaveCountGreaterThanOrEqualTo(2);
    }

    [Fact]
    public void AuthenticationRules_rejects_api_key_enabled_without_keys()
    {
        Dictionary<string, string?> settings = new()
        {
            ["Authentication:ApiKey:Enabled"] = "true",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        AuthenticationRules.CollectApiKeyWhenEnabled(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("AdminKey", StringComparison.Ordinal));
    }

    [Fact]
    public void AuthenticationRules_rejects_placeholder_api_keys_in_production()
    {
        Dictionary<string, string?> settings = new()
        {
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:AdminKey"] = "changeme",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        AuthenticationRules.CollectProductionApiKeyPlaceholders(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("placeholder", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void SchemaValidationRules_rejects_empty_and_absolute_schema_paths()
    {
        Dictionary<string, string?> settings = new()
        {
            ["SchemaValidation:AgentResultSchemaPath"] = "",
            ["SchemaValidation:GoldenManifestSchemaPath"] = "C:\\absolute\\schema.json",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        SchemaValidationRules.Collect(configuration, errors);

        errors.Should().HaveCountGreaterThanOrEqualTo(2);
    }

    [Fact]
    public void HotPathCacheRules_rejects_memory_provider_with_multiple_replicas_outside_development()
    {
        Dictionary<string, string?> settings = new()
        {
            ["HotPathCache:Enabled"] = "true",
            ["HotPathCache:Provider"] = "Memory",
            ["HotPathCache:ExpectedApiReplicaCount"] = "2",
            ["HotPathCache:AbsoluteExpirationSeconds"] = "4000",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestWebHostEnvironment environment = new() { EnvironmentName = Environments.Staging };
        List<string> errors = [];

        HotPathCacheRules.Collect(configuration, environment, errors);

        errors.Should().Contain(e => e.Contains("ExpectedApiReplicaCount", StringComparison.Ordinal));
        errors.Should().Contain(e => e.Contains("AbsoluteExpirationSeconds", StringComparison.Ordinal));
    }

    [Fact]
    public void E2EHarnessRules_rejects_enabled_in_staging()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ArchLucid:E2eHarness:Enabled"] = "true",
            ["ArchLucid:E2eHarness:SharedSecret"] = "short",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestWebHostEnvironment environment = new() { EnvironmentName = Environments.Staging };
        List<string> errors = [];

        E2EHarnessRules.Collect(configuration, environment, errors);

        errors.Should().ContainSingle(e => e.Contains("E2eHarness:Enabled", StringComparison.Ordinal));
    }

    [Fact]
    public void CosmosPolyglotRules_requires_connection_string_when_features_enabled()
    {
        Dictionary<string, string?> settings = new()
        {
            ["CosmosDb:GraphSnapshotsEnabled"] = "true",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestWebHostEnvironment environment = new() { EnvironmentName = Environments.Development };
        List<string> errors = [];

        CosmosPolyglotRules.Collect(configuration, environment, errors);

        errors.Should().ContainSingle(e => e.Contains("CosmosDb:ConnectionString", StringComparison.Ordinal));
    }

    [Fact]
    public void CosmosPolyglotRules_requires_account_endpoint_for_managed_identity_mode()
    {
        Dictionary<string, string?> settings = new()
        {
            ["CosmosDb:GraphSnapshotsEnabled"] = "true",
            ["CosmosDb:AuthenticationMode"] = "ManagedIdentity",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestWebHostEnvironment environment = new() { EnvironmentName = Environments.Development };
        List<string> errors = [];

        CosmosPolyglotRules.Collect(configuration, environment, errors);

        errors.Should().ContainSingle(e => e.Contains("CosmosDb:AccountEndpoint", StringComparison.Ordinal));
    }

    [Fact]
    public void ArchLucidSecretProviderRules_requires_key_vault_in_production_like_hosts()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ArchLucid:Secrets:Provider"] = "EnvironmentVariable",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestHostEnvironment environment = new() { EnvironmentName = Environments.Production };
        List<string> errors = [];

        ArchLucidSecretProviderRules.Collect(configuration, environment, errors);

        errors.Should().ContainSingle(e => e.Contains("KeyVault", StringComparison.Ordinal));
    }

    [Fact]
    public void ContainerJobsOffloadRules_requires_deployed_names_for_offloaded_jobs_in_production_worker()
    {
        Dictionary<string, string?> settings = new()
        {
            ["Jobs:OffloadedToContainerJobs:0"] = "retrieval-indexer",
            ["Jobs:DeployedContainerJobNames"] = "other-job",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestHostEnvironment environment = new() { EnvironmentName = Environments.Production };
        List<string> errors = [];

        ContainerJobsOffloadRules.Collect(configuration, environment, ArchLucidHostingRole.Worker, errors);

        errors.Should().ContainSingle(e => e.Contains("retrieval-indexer", StringComparison.Ordinal));
    }

    [Fact]
    public void BillingProductionSafetyRules_rejects_stripe_test_key_and_logs_critical()
    {
        Dictionary<string, string?> settings = new()
        {
            ["Billing:Stripe:SecretKey"] = "sk_test_abc",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];
        List<string> logMessages = [];
        CollectingLogger<object> logger = new(logMessages);

        BillingProductionSafetyRules.CollectStripeTestKeyDisallowedInProduction(configuration, errors);
        BillingProductionSafetyRules.LogCriticalForMatchingErrors(errors, logger);

        errors.Should().ContainSingle(e => BillingProductionSafetyRules.IsBillingSafetyError(e));
        logMessages.Should().ContainSingle(m => m.Contains("Billing production safety", StringComparison.Ordinal));
    }

    [Fact]
    public void ContentSafetyRules_requires_endpoint_and_key_in_production_like_hosts()
    {
        Dictionary<string, string?> settings = new();
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestHostEnvironment environment = new() { EnvironmentName = Environments.Production };
        List<string> errors = [];

        ContentSafetyRules.Collect(configuration, environment, errors);

        errors.Should().ContainSingle(e => e.Contains("ContentSafety:Endpoint", StringComparison.Ordinal));
    }

    private sealed class TestWebHostEnvironment : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "ArchLucid.Host.Core.Tests";

        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();

        public string WebRootPath { get; set; } = AppContext.BaseDirectory;

        public string EnvironmentName { get; set; } = Environments.Development;

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;

        public string ApplicationName { get; set; } = "ArchLucid.Host.Core.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class CollectingLogger<T>(List<string> messages) : ILogger<T>
    {
        public IDisposable? BeginScope<TState>(TState state)
            where TState : notnull => NullDisposable.Instance;

        public bool IsEnabled(LogLevel logLevel) => logLevel >= LogLevel.Information;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            if (!IsEnabled(logLevel))
                return;

            messages.Add(formatter(state, exception));
        }

        private sealed class NullDisposable : IDisposable
        {
            public static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
