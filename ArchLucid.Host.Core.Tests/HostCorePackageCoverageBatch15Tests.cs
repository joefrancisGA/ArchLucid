using System.Reflection;
using System.Text.Json;

using ArchLucid.Application.Jobs;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Host.Core.Startup.Diagnostics;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Provenance;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch15Tests
{
    [Fact]
    public void ComparisonNarrativeSummaryBuilder_throws_when_comparison_is_null()
    {
        Action act = () => ComparisonNarrativeSummaryBuilder.Build(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void ComparisonNarrativeSummaryBuilder_orders_top_three_non_empty_categories_by_count()
    {
        ComparisonResult comparison = new()
        {
            TotalDeltaCount = 17,
            DecisionChanges =
            [
                new DecisionDelta { DecisionKey = "d1", ChangeType = "Modified" },
                new DecisionDelta { DecisionKey = "d2", ChangeType = "Added" },
                new DecisionDelta { DecisionKey = "d3", ChangeType = "Removed" },
                new DecisionDelta { DecisionKey = "d4", ChangeType = "Modified" },
                new DecisionDelta { DecisionKey = "d5", ChangeType = "Modified" },
            ],
            RequirementChanges =
            [
                new RequirementDelta { RequirementName = "r1", ChangeType = "Changed" },
                new RequirementDelta { RequirementName = "r2", ChangeType = "Changed" },
                new RequirementDelta { RequirementName = "r3", ChangeType = "Changed" },
            ],
            SecurityChanges =
            [
                new SecurityDelta { ControlName = "s1", BaseStatus = "Fail", TargetStatus = "Pass" },
                new SecurityDelta { ControlName = "s2", BaseStatus = "Fail", TargetStatus = "Pass" },
                new SecurityDelta { ControlName = "s3", BaseStatus = "Fail", TargetStatus = "Pass" },
                new SecurityDelta { ControlName = "s4", BaseStatus = "Fail", TargetStatus = "Pass" },
                new SecurityDelta { ControlName = "s5", BaseStatus = "Fail", TargetStatus = "Pass" },
                new SecurityDelta { ControlName = "s6", BaseStatus = "Fail", TargetStatus = "Pass" },
                new SecurityDelta { ControlName = "s7", BaseStatus = "Fail", TargetStatus = "Pass" },
            ],
            TopologyChanges =
            [
                new TopologyDelta { Resource = "subnet-a", ChangeType = "Added" },
                new TopologyDelta { Resource = "subnet-b", ChangeType = "Removed" },
            ],
            CostChanges = [],
            SummaryHighlights =
            [
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
                "h7",
            ],
        };

        ComparisonNarrativeSummaryBuilder.ComparisonNarrativeSummary summary =
            ComparisonNarrativeSummaryBuilder.Build(comparison);

        summary.TotalDeltaCount.Should().Be(17);
        summary.DecisionChanges.Should().Be(5);
        summary.RequirementChanges.Should().Be(3);
        summary.SecurityChanges.Should().Be(7);
        summary.TopologyChanges.Should().Be(2);
        summary.CostChanges.Should().Be(0);
        summary.TopCategoryChanges.Should().HaveCount(3);
        summary.TopCategoryChanges[0].Category.Should().Be("security");
        summary.TopCategoryChanges[0].ChangeCount.Should().Be(7);
        summary.TopCategoryChanges[1].Category.Should().Be("decisions");
        summary.TopCategoryChanges[1].ChangeCount.Should().Be(5);
        summary.TopCategoryChanges[2].Category.Should().Be("requirements");
        summary.TopCategoryChanges[2].ChangeCount.Should().Be(3);
        summary.TopCategoryChanges.Select(row => row.Category).Should().NotContain("cost");
        summary.SummaryHighlights.Should().HaveCount(5);
        summary.SummaryHighlights.Should().Equal("h1", "h2", "h3", "h4", "h5");
    }

    [Fact]
    public void ComparisonNarrativeSummaryBuilder_omits_top_categories_when_all_counts_are_zero()
    {
        ComparisonResult comparison = new()
        {
            TotalDeltaCount = 0,
            SummaryHighlights = ["no deltas"],
        };

        ComparisonNarrativeSummaryBuilder.ComparisonNarrativeSummary summary =
            ComparisonNarrativeSummaryBuilder.Build(comparison);

        summary.TopCategoryChanges.Should().BeEmpty();
        summary.SummaryHighlights.Should().ContainSingle().Which.Should().Be("no deltas");
    }

    [Fact]
    public void ContextBuilder_without_manifest_includes_comparison_summary_and_decision_changes()
    {
        ComparisonResult comparison = new()
        {
            BaseRunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            TargetRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            SummaryHighlights = ["decision drift"],
            DecisionChanges =
            [
                new DecisionDelta
                {
                    DecisionKey = "encrypt-at-rest",
                    ChangeType = "Modified",
                    BaseValue = "off",
                    TargetValue = "on",
                },
            ],
            SecurityChanges = [new SecurityDelta { ControlName = "mfa", BaseStatus = "Fail", TargetStatus = "Pass" }],
        };

        object context = ContextBuilder.BuildContext(manifest: null, provenance: null, comparison);
        using JsonDocument json = JsonSerializer.SerializeToDocument(context);

        json.RootElement.GetProperty("ManifestAvailable").GetBoolean().Should().BeFalse();
        json.RootElement.GetProperty("ComparisonSummary").GetProperty("SecurityChangeCount").GetInt32().Should().Be(1);
        json.RootElement.GetProperty("Changes").EnumerateArray().Should().HaveCount(1);
        json.RootElement.GetProperty("Changes")[0].GetProperty("DecisionKey").GetString()
            .Should().Be("encrypt-at-rest");
    }

    [Fact]
    public void ContextBuilder_truncates_large_provenance_graph_and_unresolved_issues()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items = Enumerable.Range(1, 30)
                    .Select(index => new ManifestIssue
                    {
                        Severity = "Warning",
                        Title = $"Issue {index}",
                        Description = $"Description {index}",
                    })
                    .ToList(),
            },
        };
        GraphViewModel provenance = new()
        {
            Nodes = Enumerable.Range(1, 121)
                .Select(index => new GraphNodeVm
                {
                    Id = $"n{index}",
                    Label = $"Node {index}",
                    Type = "decision",
                })
                .ToList(),
            Edges = Enumerable.Range(1, 201)
                .Select(index => new GraphEdgeVm
                {
                    Source = $"n{index}",
                    Target = $"n{index + 1}",
                    Type = "supports",
                })
                .ToList(),
        };

        object context = ContextBuilder.BuildContext(manifest, provenance, comparison: null);
        using JsonDocument json = JsonSerializer.SerializeToDocument(context);

        json.RootElement.GetProperty("ProvenanceGraph").GetProperty("NodeCount").GetInt32().Should().Be(121);
        json.RootElement.GetProperty("ProvenanceGraph").GetProperty("EdgeCount").GetInt32().Should().Be(201);
        json.RootElement.GetProperty("ProvenanceGraph").GetProperty("Nodes").EnumerateArray().Should().HaveCount(120);
        json.RootElement.GetProperty("ProvenanceGraph").GetProperty("Edges").EnumerateArray().Should().HaveCount(200);
        json.RootElement.GetProperty("UnresolvedIssues").EnumerateArray().Should().HaveCount(25);
    }

    [Fact]
    public async Task DurableBackgroundJobQueue_EnqueueAsync_throws_when_pending_capacity_is_reached()
    {
        Mock<IBackgroundJobRepository> repository = new();
        repository
            .Setup(r => r.CountNonTerminalAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);
        DurableBackgroundJobQueue queue = CreateQueue(repository, maxPendingJobs: 2);
        AnalysisReportDocxWorkUnit workUnit = CreateWorkUnit("capacity");

        Func<Task> act = async () => await queue.EnqueueAsync(workUnit, maxRetries: 1, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*capacity*");
        repository.Verify(r => r.InsertAsync(It.IsAny<BackgroundJobRow>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(-3, 0)]
    [InlineData(99, 10)]
    public async Task DurableBackgroundJobQueue_EnqueueAsync_clamps_max_retries(int requested, int expected)
    {
        Mock<IBackgroundJobRepository> repository = new();
        repository
            .Setup(r => r.CountNonTerminalAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
        BackgroundJobRow? inserted = null;
        repository
            .Setup(r => r.InsertAsync(It.IsAny<BackgroundJobRow>(), It.IsAny<CancellationToken>()))
            .Callback<BackgroundJobRow, CancellationToken>((row, _) => inserted = row)
            .Returns(Task.CompletedTask);
        Mock<IBackgroundJobQueueNotifySender> notifySender = new();
        notifySender
            .Setup(n => n.SendJobIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        DurableBackgroundJobQueue queue = CreateQueue(repository, notifySender, maxPendingJobs: 5);

        string jobId = await queue.EnqueueAsync(CreateWorkUnit("clamp"), requested, CancellationToken.None);

        jobId.Should().NotBeNullOrWhiteSpace();
        inserted.Should().NotBeNull();
        inserted!.MaxRetries.Should().Be(expected);
        notifySender.Verify(n => n.SendJobIdAsync(jobId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DurableBackgroundJobQueue_GetInfoAsync_and_GetFileAsync_handle_blank_or_incomplete_rows()
    {
        Mock<IBackgroundJobRepository> repository = new();
        repository
            .Setup(r => r.GetAsync("job-complete", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BackgroundJobRow
            {
                JobId = "job-complete",
                State = nameof(BackgroundJobState.Pending),
                CreatedUtc = DateTimeOffset.UtcNow,
            });
        repository
            .Setup(r => r.GetAsync("job-incomplete", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BackgroundJobRow
            {
                JobId = "job-incomplete",
                State = nameof(BackgroundJobState.Succeeded),
                CreatedUtc = DateTimeOffset.UtcNow,
                ResultBlobName = "blob-name",
                FileName = null,
                ContentType = "application/octet-stream",
            });
        Mock<IBackgroundJobResultBlobAccessor> blobs = new();
        DurableBackgroundJobQueue queue = new(
            repository.Object,
            Mock.Of<IBackgroundJobQueueNotifySender>(),
            blobs.Object,
            Options.Create(new BackgroundJobsOptions()));

        BackgroundJobInfo? blank = await queue.GetInfoAsync("   ", CancellationToken.None);
        BackgroundJobInfo? pending = await queue.GetInfoAsync("job-complete", CancellationToken.None);
        BackgroundJobFile? missingFile = await queue.GetFileAsync("job-incomplete", CancellationToken.None);

        blank.Should().BeNull();
        pending.Should().NotBeNull();
        pending!.State.Should().Be(BackgroundJobState.Pending);
        missingFile.Should().BeNull();
        blobs.Verify(
            b => b.DownloadAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public void ArchLucidConfigurationBridge_exposes_section_names_and_auth_values()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [HostDefaults.EnvironmentKey] = Environments.Development,
                ["ArchLucidAuth:Mode"] = "ApiKey",
            })
            .Build();

        ArchLucidConfigurationBridge.ArchLucidSectionName.Should().Be("ArchLucid");
        ArchLucidConfigurationBridge.ArchLucidAuthSectionName.Should().Be("ArchLucidAuth");
        ArchLucidConfigurationBridge.PrimarySqlConnectionName.Should().Be("ArchLucid");
        ArchLucidConfigurationBridge.SystemSqlConnectionName.Should().Be("ArchLucidSystem");
        ArchLucidConfigurationBridge.ResolveAuthConfigurationValue(configuration, "Mode").Should().Be("ApiKey");
        ArchLucidConfigurationBridge.ShouldEnforceSqlServerCertificateTrust(configuration).Should().BeFalse();
    }

    [Fact]
    public void StartupConfigurationFactsReader_builds_non_secret_effective_configuration()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucid:StorageProvider"] = "Sql",
                ["Retrieval:VectorIndex"] = "AzureSearch",
                ["AgentExecution:Mode"] = "Real",
                ["ArchLucidAuth:Mode"] = "JwtBearer",
                ["Authentication:ApiKey:Enabled"] = "true",
                ["Authentication:ApiKey:AdminKey"] = "admin-key",
                ["RateLimiting:FixedWindow:PermitLimit"] = "50",
                ["Observability:Prometheus:Enabled"] = "true",
                ["Demo:Enabled"] = "true",
                ["Demo:SeedOnStartup"] = "false",
                ["SchemaValidation:EnableDetailedErrors"] = "true",
            })
            .Build();
        IHostEnvironment environment = new TestHostEnvironment { EnvironmentName = Environments.Staging };
        Assembly hostAssembly = typeof(DurableBackgroundJobQueue).Assembly;

        StartupConfigurationFacts facts = StartupConfigurationFactsReader.FromConfiguration(
            configuration,
            environment,
            hostAssembly);

        facts.HostEnvironmentName.Should().Be(Environments.Staging);
        facts.ArchLucidStorageProvider.Should().Be("Sql");
        facts.RetrievalVectorIndex.Should().Be("AzureSearch");
        facts.AgentExecutionMode.Should().Be("Real");
        facts.ArchLucidAuthMode.Should().Be("JwtBearer");
        facts.AuthenticationApiKeyEnabled.Should().BeTrue();
        facts.AuthenticationApiKeyAdminConfigured.Should().BeTrue();
        facts.AuthenticationApiKeyReadOnlyConfigured.Should().BeFalse();
        facts.RateLimitingFixedWindowPermitLimit.Should().Be(50);
        facts.ObservabilityPrometheusEnabled.Should().BeTrue();
        facts.DemoEnabled.Should().BeTrue();
        facts.DemoSeedOnStartup.Should().BeFalse();
        facts.SchemaValidationEnableDetailedErrors.Should().BeTrue();
        facts.CosmosDbPolyglotAnyFeatureEnabled.Should().BeFalse();
        facts.CosmosDbConnectivitySummary.Should().Be("disabled");
        facts.BuildAssemblyVersion.Should().NotBeNullOrWhiteSpace();
        facts.RuntimeFrameworkDescription.Should().NotBeNullOrWhiteSpace();
    }

    [Theory]
    [InlineData("Pending", BackgroundJobState.Pending)]
    [InlineData("running", BackgroundJobState.Running)]
    public void BackgroundJobPersistenceMapper_maps_known_non_terminal_states(string rawState, BackgroundJobState expected)
    {
        BackgroundJobRow row = new()
        {
            JobId = "job-active",
            State = rawState,
            CreatedUtc = DateTimeOffset.UtcNow,
        };

        BackgroundJobInfo? info = BackgroundJobPersistenceMapper.ToInfo(row);

        info.Should().NotBeNull();
        info!.State.Should().Be(expected);
    }

    private static DurableBackgroundJobQueue CreateQueue(
        Mock<IBackgroundJobRepository> repository,
        Mock<IBackgroundJobQueueNotifySender>? notifySender = null,
        int maxPendingJobs = 500)
    {
        Mock<IBackgroundJobQueueNotifySender> sender = notifySender ?? new Mock<IBackgroundJobQueueNotifySender>();
        Mock<IBackgroundJobResultBlobAccessor> blobs = new();

        return new DurableBackgroundJobQueue(
            repository.Object,
            sender.Object,
            blobs.Object,
            Options.Create(new BackgroundJobsOptions { MaxPendingJobs = maxPendingJobs }));
    }

    private static AnalysisReportDocxWorkUnit CreateWorkUnit(string runId)
    {
        return new AnalysisReportDocxWorkUnit(
            new AnalysisReportDocxJobPayload { RunId = runId },
            $"{runId}.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;

        public string ApplicationName { get; set; } = "ArchLucid.Host.Core.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
