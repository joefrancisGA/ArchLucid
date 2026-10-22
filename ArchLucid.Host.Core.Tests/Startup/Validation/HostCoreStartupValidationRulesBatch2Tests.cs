using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup.Validation.Rules;
using ArchLucid.Persistence.Coordination.Caching;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Host.Core.Tests.Startup.Validation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCoreStartupValidationRulesBatch2Tests
{
    [Fact]
    public void E2EHarnessRules_skips_when_disabled()
    {
        IConfiguration configuration = Config(("ArchLucid:E2eHarness:Enabled", "false"));
        List<string> errors = [];

        E2EHarnessRules.Collect(configuration, new TestWebHostEnvironment(), errors);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void E2EHarnessRules_rejects_enabled_in_production()
    {
        IConfiguration configuration = Config(
            ("ArchLucid:E2eHarness:Enabled", "true"),
            ("ArchLucid:E2eHarness:SharedSecret", "1234567890123456"));
        List<string> errors = [];

        E2EHarnessRules.Collect(
            configuration,
            new TestWebHostEnvironment { EnvironmentName = Environments.Production },
            errors);

        errors.Should().ContainSingle(e => e.Contains("E2eHarness:Enabled", StringComparison.Ordinal));
    }

    [Fact]
    public void E2EHarnessRules_requires_strong_secret_when_enabled_in_development()
    {
        IConfiguration configuration = Config(("ArchLucid:E2eHarness:Enabled", "true"));
        List<string> errors = [];

        E2EHarnessRules.Collect(configuration, new TestWebHostEnvironment(), errors);

        errors.Should().ContainSingle(e => e.Contains("SharedSecret", StringComparison.Ordinal));
    }

    [Fact]
    public void BatchReplayRules_rejects_out_of_range_max_ids()
    {
        IConfiguration configuration = Config(("ComparisonReplay:Batch:MaxComparisonRecordIds", "999"));
        List<string> errors = [];

        BatchReplayRules.Collect(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("MaxComparisonRecordIds", StringComparison.Ordinal));
    }

    [Fact]
    public void ApiDeprecationRules_rejects_unparseable_sunset_date()
    {
        IConfiguration configuration = Config(
            ("ApiDeprecation:Enabled", "true"),
            ("ApiDeprecation:SunsetHttpDate", "not-a-date"));
        List<string> errors = [];

        ApiDeprecationRules.Collect(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("SunsetHttpDate", StringComparison.Ordinal));
    }

    [Fact]
    public void HostLeaderElectionRules_rejects_invalid_lease_and_renew_intervals()
    {
        IConfiguration configuration = Config(
            ("HostLeaderElection:Enabled", "true"),
            ("HostLeaderElection:LeaseDurationSeconds", "5"),
            ("HostLeaderElection:RenewIntervalSeconds", "90"),
            ("HostLeaderElection:FollowerPollMilliseconds", "50"));
        List<string> errors = [];

        HostLeaderElectionRules.Collect(configuration, errors);

        errors.Should().HaveCount(3);
    }

    [Fact]
    public void StorageRules_requires_sql_connection_when_storage_is_sql()
    {
        IConfiguration configuration = Config(("ArchLucid:StorageProvider", "Sql"));
        ArchLucidOptions options = new() { StorageProvider = "Sql" };
        List<string> errors = [];

        StorageRules.Collect(configuration, options, errors);

        errors.Should().ContainSingle(e => e.Contains("ConnectionStrings:ArchLucid", StringComparison.Ordinal));
    }

    [Fact]
    public void StorageRules_rejects_invalid_storage_provider()
    {
        IConfiguration configuration = Config();
        ArchLucidOptions options = new() { StorageProvider = "CosmosOnly" };
        List<string> errors = [];

        StorageRules.Collect(configuration, options, errors);

        errors.Should().ContainSingle(e => e.Contains("StorageProvider", StringComparison.Ordinal));
    }

    [Fact]
    public void RetrievalRules_rejects_invalid_embedding_caps_and_vector_index()
    {
        IConfiguration configuration = Config(
            ("Retrieval:EmbeddingCaps:MaxTextsPerEmbeddingRequest", "0"),
            ("Retrieval:EmbeddingCaps:MaxChunksPerIndexOperation", "2000001"),
            ("Retrieval:VectorIndex", "Elastic"));
        List<string> errors = [];

        RetrievalRules.CollectEmbeddingCaps(configuration, errors);
        RetrievalRules.CollectVectorIndex(configuration, errors);

        errors.Should().HaveCount(3);
    }

    [Fact]
    public void HotPathCacheRules_rejects_invalid_provider_and_redis_without_connection_string()
    {
        IConfiguration configuration = Config(
            ("HotPathCache:Enabled", "true"),
            ("HotPathCache:Provider", "Memcached"),
            ("HotPathCache:AbsoluteExpirationSeconds", "4000"));
        List<string> errors = [];

        HotPathCacheRules.Collect(configuration, new TestWebHostEnvironment(), errors);

        errors.Should().Contain(e => e.Contains("HotPathCache:Provider", StringComparison.Ordinal));
        errors.Should().Contain(e => e.Contains("AbsoluteExpirationSeconds", StringComparison.Ordinal));
    }

    [Fact]
    public void HotPathCacheRules_rejects_memory_provider_with_multiple_replicas_outside_development()
    {
        HotPathCacheOptions options = new()
        {
            Enabled = true,
            Provider = "Auto",
            ExpectedApiReplicaCount = 3,
            RedisConnectionString = string.Empty,
        };

        IConfiguration configuration = Config(
            ("HotPathCache:Enabled", "true"),
            ("HotPathCache:Provider", options.Provider),
            ("HotPathCache:ExpectedApiReplicaCount", "3"));
        List<string> errors = [];

        HotPathCacheRules.Collect(
            configuration,
            new TestWebHostEnvironment { EnvironmentName = Environments.Production },
            errors);

        errors.Should().ContainSingle(e => e.Contains("cache coherence", StringComparison.OrdinalIgnoreCase));
        HotPathCacheProviderResolver.ResolveEffectiveProvider(options).Should().Be("Memory");
    }

    [Fact]
    public void AgentExecutionRules_collect_rejects_invalid_mode_and_incomplete_real_configuration()
    {
        IConfiguration configuration = Config(
            ("AgentExecution:Mode", "Real"),
            ("AgentExecution:CompletionClient", "Unknown"),
            ("AzureOpenAI:MaxCompletionTokens", "-1"));
        List<string> errors = [];

        AgentExecutionRules.Collect(configuration, errors);

        errors.Should().Contain(e => e.Contains("CompletionClient", StringComparison.Ordinal));
        errors.Should().Contain(e => e.Contains("Azure OpenAI", StringComparison.Ordinal));
        errors.Should().Contain(e => e.Contains("MaxCompletionTokens", StringComparison.Ordinal));
    }

    [Fact]
    public void AgentExecutionRules_log_information_when_real_mode_fully_configured()
    {
        IConfiguration configuration = Config(
            ("AgentExecution:Mode", "Real"),
            ("AzureOpenAI:Endpoint", "https://example.openai.azure.com/"),
            ("AzureOpenAI:ApiKey", "key"),
            ("AzureOpenAI:DeploymentName", "gpt"));

        AgentExecutionRules.LogInformationWhenRealModeConfigured(configuration, NullLogger.Instance);
    }

    [Fact]
    public void BackgroundJobsRules_requires_sql_and_blob_when_durable()
    {
        IConfiguration configuration = Config(
            ("BackgroundJobs:Mode", "Durable"),
            ("ArchLucid:StorageProvider", "InMemory"),
            ("ArtifactLargePayload:BlobProvider", "None"),
            ("BackgroundJobs:ProcessorReceiveBatchSize", "64"));
        List<string> errors = [];

        BackgroundJobsRules.Collect(configuration, errors);

        errors.Should().HaveCountGreaterThanOrEqualTo(3);
    }

    [Fact]
    public void LlmDailyTenantBudgetRules_validates_enabled_budget_bounds()
    {
        IConfiguration configuration = Config(
            ("LlmDailyTenantBudget:Enabled", "true"),
            ("LlmDailyTenantBudget:HardCutoffTokensPerUtcDay", "0"),
            ("LlmDailyTenantBudget:WarnFraction", "1.5"),
            ("LlmDailyTenantBudget:AssumedMaxTotalTokensPerRequest", "0"));
        List<string> errors = [];

        LlmDailyTenantBudgetRules.Collect(configuration, errors);

        errors.Should().HaveCount(3);
    }

    private static IConfiguration Config(params (string Key, string? Value)[] settings)
    {
        return new ConfigurationBuilder().AddInMemoryCollection(settings.ToDictionary(s => s.Key, s => s.Value)).Build();
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
}
