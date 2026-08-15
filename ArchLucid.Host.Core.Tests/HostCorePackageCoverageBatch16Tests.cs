using System.Reflection;
using System.Text.Json;

using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Host.Core.Startup.Diagnostics;
using ArchLucid.Persistence.Cosmos;

using FluentAssertions;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

using Moq;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch16Tests
{
    private static Assembly HostAssembly => typeof(ArchLucidConfigurationBridge).Assembly;

    [Theory]
    [InlineData(false, null, "disabled")]
    [InlineData(true, null, "missing")]
    [InlineData(true, "AccountEndpoint=https://localhost:8081/;AccountKey=key;", "emulator")]
    [InlineData(true, "AccountEndpoint=https://127.0.0.1:8081/;AccountKey=key;", "emulator")]
    [InlineData(true, "AccountEndpoint=https://contoso.documents.azure.com:443/;AccountKey=key;", "configured")]
    public void StartupConfigurationFactsReader_summarizes_cosmos_connectivity(
        bool graphSnapshotsEnabled,
        string? connectionString,
        string expectedSummary)
    {
        Dictionary<string, string?> data = new()
        {
            [$"{CosmosDbOptions.SectionName}:GraphSnapshotsEnabled"] = graphSnapshotsEnabled.ToString(),
        };

        if (connectionString is not null)

            data[$"{CosmosDbOptions.SectionName}:ConnectionString"] = connectionString;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IHostEnvironment> environment = new();
        environment.SetupGet(e => e.EnvironmentName).Returns(Environments.Development);
        environment.SetupGet(e => e.ContentRootPath).Returns(AppContext.BaseDirectory);

        StartupConfigurationFacts facts = StartupConfigurationFactsReader.FromConfiguration(
            configuration,
            environment.Object,
            HostAssembly);

        facts.CosmosDbConnectivitySummary.Should().Be(expectedSummary);
        facts.CosmosDbPolyglotAnyFeatureEnabled.Should().Be(graphSnapshotsEnabled);
    }

    [Fact]
    public void StartupConfigurationFactsReader_summarizes_managed_identity_cosmos_connectivity()
    {
        Dictionary<string, string?> data = new()
        {
            [$"{CosmosDbOptions.SectionName}:GraphSnapshotsEnabled"] = "true",
            [$"{CosmosDbOptions.SectionName}:AuthenticationMode"] = "ManagedIdentity",
            [$"{CosmosDbOptions.SectionName}:AccountEndpoint"] = "https://contoso.documents.azure.com:443/",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IHostEnvironment> environment = new();
        environment.SetupGet(e => e.EnvironmentName).Returns(Environments.Development);
        environment.SetupGet(e => e.ContentRootPath).Returns(AppContext.BaseDirectory);

        StartupConfigurationFacts facts = StartupConfigurationFactsReader.FromConfiguration(
            configuration,
            environment.Object,
            HostAssembly);

        facts.CosmosDbConnectivitySummary.Should().Be("managed-identity");
    }

    [Fact]
    public void ContextBuilder_BuildContext_with_manifest_and_comparison_surfaces_compliance_cost_and_provenance_ids()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
        };
        manifest.Compliance.Gaps = ["Missing MFA enforcement"];
        manifest.Cost.MaxMonthlyCost = 4500m;
        manifest.Cost.CostRisks = ["Under-provisioned reserved capacity"];
        manifest.Provenance.SourceFindingIds = ["finding-1"];
        manifest.Provenance.SourceGraphNodeIds = ["node-1"];
        manifest.Provenance.AppliedRuleIds = ["rule-1"];
        ComparisonResult comparison = new()
        {
            BaseRunId = Guid.NewGuid(),
            TargetRunId = Guid.NewGuid(),
            SummaryHighlights = ["cost drift"],
        };

        object context = ContextBuilder.BuildContext(manifest, provenance: null, comparison);
        using JsonDocument json = JsonSerializer.SerializeToDocument(context);

        json.RootElement.GetProperty("ComplianceGaps")[0].GetString().Should().Be("Missing MFA enforcement");
        json.RootElement.GetProperty("Cost").GetProperty("MaxMonthlyCost").GetDecimal().Should().Be(4500m);
        json.RootElement.GetProperty("Cost").GetProperty("CostRisks")[0].GetString()
            .Should().Be("Under-provisioned reserved capacity");
        json.RootElement.GetProperty("Findings")[0].GetString().Should().Be("finding-1");
        json.RootElement.GetProperty("SourceGraphNodeIds")[0].GetString().Should().Be("node-1");
        json.RootElement.GetProperty("AppliedRuleIds")[0].GetString().Should().Be("rule-1");
        json.RootElement.GetProperty("ComparisonSummary").GetProperty("SummaryHighlights")[0].GetString()
            .Should().Be("cost drift");
    }

    [Fact]
    public void AskUserPromptStaticPrefix_ArchitectUserPrefix_carries_evidence_only_guardrail()
    {
        AskUserPromptStaticPrefix.ArchitectUserPrefix.Should().StartWith(
            "Answer using ONLY the sections below");
        AskUserPromptStaticPrefix.ArchitectUserPrefix.Should().Contain(
            "Do not invent services, findings, artifacts, or costs");
        AskUserPromptStaticPrefix.ArchitectUserPrefix.Should().EndWith("\n\n");
    }

    [Fact]
    public void PostCommitProjectionOutboxProcessorOptions_exposes_section_name_and_defaults()
    {
        PostCommitProjectionOutboxProcessorOptions options = new();

        PostCommitProjectionOutboxProcessorOptions.SectionName.Should().Be("PostCommitProjectionOutbox");
        options.LeaseDurationSeconds.Should().Be(300);
        options.MaxAttemptsBeforeDeadLetter.Should().Be(48);
        options.RetryBackoffBaseSeconds.Should().Be(10);
        options.RetryBackoffMaxSeconds.Should().Be(900);
    }

    [Fact]
    public void RetrievalIndexingOutboxProcessorOptions_exposes_section_name_and_defaults()
    {
        RetrievalIndexingOutboxProcessorOptions options = new();

        RetrievalIndexingOutboxProcessorOptions.SectionName.Should().Be("RetrievalIndexingOutbox");
        options.LeaseDurationSeconds.Should().Be(300);
        options.MaxAttemptsBeforeDeadLetter.Should().Be(48);
        options.RetryBackoffBaseSeconds.Should().Be(10);
        options.RetryBackoffMaxSeconds.Should().Be(900);
    }

    [Fact]
    public void CosmosGraphSnapshotOutboxProcessorOptions_exposes_section_name_and_defaults()
    {
        CosmosGraphSnapshotOutboxProcessorOptions options = new();

        CosmosGraphSnapshotOutboxProcessorOptions.SectionName.Should().Be("CosmosGraphSnapshotOutbox");
        options.LeaseDurationSeconds.Should().Be(300);
        options.MaxAttemptsBeforeDeadLetter.Should().Be(8);
        options.RetryBackoffBaseSeconds.Should().Be(30);
        options.RetryBackoffMaxSeconds.Should().Be(900);
        options.PollIntervalSeconds.Should().Be(15);
    }

    [Fact]
    public void RunExportBlobPushOutboxProcessorOptions_exposes_section_name_and_defaults()
    {
        RunExportBlobPushOutboxProcessorOptions options = new();

        RunExportBlobPushOutboxProcessorOptions.SectionName.Should().Be("RunExportBlobPushOutbox");
        options.LeaseDurationSeconds.Should().Be(300);
        options.MaxAttemptsBeforeDeadLetter.Should().Be(48);
        options.RetryBackoffBaseSeconds.Should().Be(10);
        options.RetryBackoffMaxSeconds.Should().Be(900);
    }

    [Fact]
    public void HostLeaderElectionOptions_exposes_section_name_and_defaults()
    {
        HostLeaderElectionOptions options = new();

        HostLeaderElectionOptions.SectionName.Should().Be("HostLeaderElection");
        options.Enabled.Should().BeTrue();
        options.LeaseDurationSeconds.Should().Be(90);
        options.RenewIntervalSeconds.Should().Be(25);
        options.FollowerPollMilliseconds.Should().Be(2000);
    }

    [Fact]
    public void DatabaseLivenessHealthCheckOptions_exposes_section_name_and_default_timeout()
    {
        DatabaseLivenessHealthCheckOptions options = new();

        DatabaseLivenessHealthCheckOptions.SectionName.Should().Be("HealthChecks:DatabaseLiveness");
        options.ProbeTimeoutSeconds.Should().Be(2);
    }

    [Fact]
    public void ArchLucidConfigurationBridge_ResolveSqlSystemConnectionString_reads_ArchLucidSystem_and_normalizes_encryption()
    {
        IConfiguration withSystemConnection = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:ArchLucidSystem"] = "Server=.;Database=system;",
            })
            .Build();
        IConfiguration withoutSystemConnection = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        string? resolved = ArchLucidConfigurationBridge.ResolveSqlSystemConnectionString(withSystemConnection);
        string? missing = ArchLucidConfigurationBridge.ResolveSqlSystemConnectionString(withoutSystemConnection);

        resolved.Should().NotBeNull();
        SqlConnectionStringBuilder parsed = new(resolved);
        parsed.Encrypt.Should().Be(SqlConnectionEncryptOption.Mandatory);
        parsed.InitialCatalog.Should().Be("system");
        missing.Should().BeNull();
    }
}
