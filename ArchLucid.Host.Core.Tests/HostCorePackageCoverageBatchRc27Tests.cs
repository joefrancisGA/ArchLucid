using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Jobs;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Authority;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Demo;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Host.Core.Startup.Tracing;
using ArchLucid.Host.Core.Startup.Validation.Rules;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Host.Core.Tests;

/// <summary>
///     RC27 coverage batch for Host.Core helpers: API-key placeholder detection, background-job URI/state mapping,
///     demo seed run resolution, always-sample span matching, and async authority pipeline mode resolution.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatchRc27Tests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ApiKeyPlaceholderDetection_blank_values_are_not_placeholders(string? value)
    {
        ApiKeyPlaceholderDetection.IsPlaceholderValue(value).Should().BeFalse();
    }

    [Theory]
    [InlineData("changeme")]
    [InlineData("PASSWORD")]
    [InlineData("api-key")]
    public void ApiKeyPlaceholderDetection_exact_blocklist_is_placeholder(string value)
    {
        ApiKeyPlaceholderDetection.IsPlaceholderValue(value).Should().BeTrue();
    }

    [Theory]
    [InlineData("prefix-todo-suffix-long-enough")]
    [InlineData("please-fixme-now-123456")]
    [InlineData("replace-this-key-value")]
    public void ApiKeyPlaceholderDetection_substring_blocklist_is_placeholder(string value)
    {
        ApiKeyPlaceholderDetection.IsPlaceholderValue(value).Should().BeTrue();
    }

    [Fact]
    public void ApiKeyPlaceholderDetection_short_non_blocklisted_value_is_placeholder()
    {
        ApiKeyPlaceholderDetection.IsPlaceholderValue("short-key").Should().BeTrue();
    }

    [Fact]
    public void ApiKeyPlaceholderDetection_long_non_blocklisted_value_is_accepted()
    {
        ApiKeyPlaceholderDetection.IsPlaceholderValue("prod-api-key-value-12345").Should().BeFalse();
    }

    [Fact]
    public void BackgroundJobQueueAddress_prefers_direct_queue_uri()
    {
        BackgroundJobsOptions jobs = new()
        {
            QueueServiceUri = " https://acct.queue.core.windows.net/ ",
        };
        ArtifactLargePayloadOptions largePayload = new()
        {
            AzureBlobServiceUri = "https://acct.blob.core.windows.net",
        };

        Uri? uri = BackgroundJobQueueAddress.ResolveQueueServiceUri(jobs, largePayload);

        uri.Should().Be(new Uri("https://acct.queue.core.windows.net/", UriKind.Absolute));
    }

    [Fact]
    public void BackgroundJobQueueAddress_derives_queue_uri_from_blob_uri()
    {
        BackgroundJobsOptions jobs = new()
        {
            QueueServiceUri = "  ",
        };
        ArtifactLargePayloadOptions largePayload = new()
        {
            AzureBlobServiceUri = "https://acct.blob.core.windows.net",
        };

        Uri? uri = BackgroundJobQueueAddress.ResolveQueueServiceUri(jobs, largePayload);

        uri.Should().Be(new Uri("https://acct.queue.core.windows.net", UriKind.Absolute));
    }

    [Fact]
    public void BackgroundJobQueueAddress_returns_null_when_blob_uri_missing_or_not_blob_host()
    {
        BackgroundJobsOptions jobs = new();

        BackgroundJobQueueAddress.ResolveQueueServiceUri(jobs, largePayload: null).Should().BeNull();
        BackgroundJobQueueAddress.ResolveQueueServiceUri(
                jobs,
                new ArtifactLargePayloadOptions { AzureBlobServiceUri = "   " })
            .Should().BeNull();
        BackgroundJobQueueAddress.ResolveQueueServiceUri(
                jobs,
                new ArtifactLargePayloadOptions { AzureBlobServiceUri = "https://acct.dfs.core.windows.net" })
            .Should().BeNull();
    }

    [Fact]
    public void BackgroundJobQueueAddress_throws_when_jobs_null()
    {
        Action act = () => BackgroundJobQueueAddress.ResolveQueueServiceUri(null!, largePayload: null);

        act.Should().Throw<ArgumentNullException>().WithParameterName("jobs");
    }

    [Fact]
    public void BackgroundJobPersistenceMapper_maps_null_known_and_unknown_states()
    {
        BackgroundJobPersistenceMapper.ToInfo(null).Should().BeNull();

        DateTimeOffset created = DateTimeOffset.Parse("2026-08-01T12:00:00Z");
        BackgroundJobRow known = new()
        {
            JobId = "job-1",
            State = "succeeded",
            CreatedUtc = created,
            StartedUtc = created.AddMinutes(1),
            CompletedUtc = created.AddMinutes(2),
            Error = "none",
            FileName = "out.zip",
            ContentType = "application/zip",
            RetryCount = 1,
            MaxRetries = 3,
        };

        BackgroundJobInfo? mapped = BackgroundJobPersistenceMapper.ToInfo(known);

        mapped.Should().NotBeNull();
        mapped!.JobId.Should().Be("job-1");
        mapped.State.Should().Be(BackgroundJobState.Succeeded);
        mapped.CreatedUtc.Should().Be(created);
        mapped.StartedUtc.Should().Be(created.AddMinutes(1));
        mapped.CompletedUtc.Should().Be(created.AddMinutes(2));
        mapped.Error.Should().Be("none");
        mapped.FileName.Should().Be("out.zip");
        mapped.ContentType.Should().Be("application/zip");
        mapped.RetryCount.Should().Be(1);
        mapped.MaxRetries.Should().Be(3);

        BackgroundJobInfo? unknown = BackgroundJobPersistenceMapper.ToInfo(new BackgroundJobRow
        {
            JobId = "job-2",
            State = "not-a-real-state",
            CreatedUtc = created,
        });

        unknown.Should().NotBeNull();
        unknown!.State.Should().Be(BackgroundJobState.Failed);
    }

    [Fact]
    public async Task DemoSeedRunResolver_returns_canonical_committed_demo_run()
    {
        RunRecord canonical = new()
        {
            RunId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId,
            ArchitectureRequestId = ContosoRetailDemoIdentifiers.RequestContoso,
            GoldenManifestId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow.AddHours(-2),
        };
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), ContosoRetailDemoIdentifiers.AuthorityRunBaselineId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(canonical);
        DemoSeedRunResolver sut = new(runs.Object, NullLogger<DemoSeedRunResolver>.Instance);

        RunRecord? resolved = await sut.ResolveLatestCommittedDemoRunAsync(CancellationToken.None);

        resolved.Should().BeSameAs(canonical);
        runs.Verify(
            r => r.ListRecentInScopeAsync(It.IsAny<ScopeContext>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DemoSeedRunResolver_falls_back_to_latest_committed_demo_from_recent_scan()
    {
        RunRecord older = new()
        {
            RunId = Guid.NewGuid(),
            ArchitectureRequestId = ContosoRetailDemoIdentifiers.RequestContoso,
            GoldenManifestId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow.AddHours(-5),
        };
        RunRecord newer = new()
        {
            RunId = Guid.NewGuid(),
            ArchitectureRequestId = ContosoRetailDemoIdentifiers.RequestContoso,
            GoldenManifestId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow.AddHours(-1),
        };
        RunRecord uncommitted = new()
        {
            RunId = Guid.NewGuid(),
            ArchitectureRequestId = ContosoRetailDemoIdentifiers.RequestContoso,
            GoldenManifestId = null,
            CreatedUtc = DateTime.UtcNow,
        };
        RunRecord nonDemo = new()
        {
            RunId = Guid.NewGuid(),
            ArchitectureRequestId = "request-other",
            GoldenManifestId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), ContosoRetailDemoIdentifiers.AuthorityRunBaselineId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);
        runs.Setup(r => r.ListRecentInScopeAsync(It.IsAny<ScopeContext>(), 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync([older, newer, uncommitted, nonDemo]);
        DemoSeedRunResolver sut = new(runs.Object, NullLogger<DemoSeedRunResolver>.Instance);

        RunRecord? resolved = await sut.ResolveLatestCommittedDemoRunAsync(CancellationToken.None);

        resolved.Should().BeSameAs(newer);
    }

    [Fact]
    public async Task DemoSeedRunResolver_returns_null_when_no_committed_demo_run_exists()
    {
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), ContosoRetailDemoIdentifiers.AuthorityRunBaselineId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId,
                ArchitectureRequestId = ContosoRetailDemoIdentifiers.RequestContoso,
                GoldenManifestId = Guid.Empty,
            });
        runs.Setup(r => r.ListRecentInScopeAsync(It.IsAny<ScopeContext>(), 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        DemoSeedRunResolver sut = new(runs.Object, NullLogger<DemoSeedRunResolver>.Instance);

        RunRecord? resolved = await sut.ResolveLatestCommittedDemoRunAsync(CancellationToken.None);

        resolved.Should().BeNull();
    }

    [Fact]
    public void DemoSeedRunResolver_ctor_rejects_null_dependencies()
    {
        Mock<IRunRepository> runs = new();

        Action nullRepo = () => _ = new DemoSeedRunResolver(null!, NullLogger<DemoSeedRunResolver>.Instance);
        Action nullLogger = () => _ = new DemoSeedRunResolver(runs.Object, null!);

        nullRepo.Should().Throw<ArgumentNullException>().WithParameterName("runRepository");
        nullLogger.Should().Throw<ArgumentNullException>().WithParameterName("logger");
    }

    [Theory]
    [InlineData(null, false)]
    [InlineData("", false)]
    [InlineData("authority.run", true)]
    [InlineData("authority.stage.commit", true)]
    [InlineData("other.span", false)]
    public void AlwaysSampleActivitySourceSpanMatcher_matches_authority_run_source(string? spanName, bool expected)
    {
        string source = ArchLucidInstrumentation.AuthorityRun.Name;

        AlwaysSampleActivitySourceSpanMatcher.Matches(source, spanName).Should().Be(expected);
    }

    [Fact]
    public void AlwaysSampleActivitySourceSpanMatcher_rejects_empty_or_unknown_sources()
    {
        AlwaysSampleActivitySourceSpanMatcher.Matches("", "authority.run").Should().BeFalse();
        AlwaysSampleActivitySourceSpanMatcher.Matches("other.source", "authority.run").Should().BeFalse();
    }

    [Fact]
    public void AlwaysSampleActivitySourceSpanMatcher_MatchesAny_short_circuits_on_first_hit()
    {
        string authority = ArchLucidInstrumentation.AuthorityRun.Name;

        AlwaysSampleActivitySourceSpanMatcher.MatchesAny(["other", authority], "authority.run").Should().BeTrue();
        AlwaysSampleActivitySourceSpanMatcher.MatchesAny(["other", "also-other"], "authority.run").Should().BeFalse();
        AlwaysSampleActivitySourceSpanMatcher.MatchesAny([], "authority.run").Should().BeFalse();
    }

    [Fact]
    public async Task FeatureManagementAuthorityPipelineModeResolver_returns_false_for_in_memory_storage()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucid:StorageProvider"] = "InMemory",
            })
            .Build();
        Mock<IFeatureFlags> flags = new();
        FeatureManagementAuthorityPipelineModeResolver sut = new(flags.Object, configuration);

        bool shouldQueue = await sut.ShouldQueueContextAndGraphStagesAsync(CancellationToken.None);

        shouldQueue.Should().BeFalse();
        flags.Verify(f => f.IsEnabledAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task FeatureManagementAuthorityPipelineModeResolver_defaults_true_when_flag_section_missing()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucid:StorageProvider"] = "Sql",
            })
            .Build();
        Mock<IFeatureFlags> flags = new();
        FeatureManagementAuthorityPipelineModeResolver sut = new(flags.Object, configuration);

        bool shouldQueue = await sut.ShouldQueueContextAndGraphStagesAsync(CancellationToken.None);

        shouldQueue.Should().BeTrue();
        flags.Verify(f => f.IsEnabledAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task FeatureManagementAuthorityPipelineModeResolver_reads_feature_flag_when_section_exists()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucid:StorageProvider"] = "Sql",
                ["FeatureManagement:FeatureFlags:AsyncAuthorityPipeline"] = "false",
            })
            .Build();
        Mock<IFeatureFlags> flags = new();
        flags.Setup(f => f.IsEnabledAsync(AuthorityPipelineFeatureFlags.AsyncAuthorityPipeline, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        FeatureManagementAuthorityPipelineModeResolver sut = new(flags.Object, configuration);

        bool shouldQueue = await sut.ShouldQueueContextAndGraphStagesAsync(CancellationToken.None);

        shouldQueue.Should().BeFalse();
        flags.Verify(
            f => f.IsEnabledAsync(AuthorityPipelineFeatureFlags.AsyncAuthorityPipeline, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task FeatureManagementAuthorityPipelineModeResolver_returns_false_for_non_sql_non_memory_provider()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucid:StorageProvider"] = "Cosmos",
            })
            .Build();
        Mock<IFeatureFlags> flags = new();
        FeatureManagementAuthorityPipelineModeResolver sut = new(flags.Object, configuration);

        bool shouldQueue = await sut.ShouldQueueContextAndGraphStagesAsync(CancellationToken.None);

        shouldQueue.Should().BeFalse();
    }

    [Fact]
    public void FeatureManagementAuthorityPipelineModeResolver_ctor_rejects_null_dependencies()
    {
        Mock<IFeatureFlags> flags = new();
        IConfiguration configuration = new ConfigurationBuilder().Build();

        Action nullFlags = () => _ = new FeatureManagementAuthorityPipelineModeResolver(null!, configuration);
        Action nullConfig = () => _ = new FeatureManagementAuthorityPipelineModeResolver(flags.Object, null!);

        nullFlags.Should().Throw<ArgumentNullException>().WithParameterName("featureFlags");
        nullConfig.Should().Throw<ArgumentNullException>().WithParameterName("configuration");
    }
}
