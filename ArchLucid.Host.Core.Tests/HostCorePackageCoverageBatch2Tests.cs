using ArchLucid.Application.Jobs;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Configuration.Secrets;
using ArchLucid.Host.Core.Health;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Host.Core.Services;
using ArchLucid.Host.Core.Services.Delivery;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch2Tests
{
    [Fact]
    public void DataConsistencyEnforcementOptions_exposes_defaults()
    {
        DataConsistencyEnforcementOptions options = new();

        DataConsistencyEnforcementOptions.SectionName.Should().Be("DataConsistency:Enforcement");
        options.Mode.Should().Be(DataConsistencyEnforcementMode.Warn);
        options.MaxRowsPerBatch.Should().Be(500);
        options.AlertThreshold.Should().Be(1);
        options.AutoQuarantine.Should().BeFalse();
    }

    [Fact]
    public void DataConsistencyProbeOptions_exposes_defaults()
    {
        DataConsistencyProbeOptions options = new();

        DataConsistencyProbeOptions.SectionName.Should().Be("DataConsistency");
        options.OrphanProbeEnabled.Should().BeTrue();
        options.OrphanProbeIntervalMinutes.Should().Be(60);
        options.EnableAutoRemediation.Should().BeFalse();
    }

    [Fact]
    public async Task EnvironmentVariableSecretProvider_reads_configuration_value()
    {
        Dictionary<string, string?> values = new() { ["SECRET_KEY"] = "value" };
        EnvironmentVariableSecretProvider sut = new(new ConfigurationBuilder().AddInMemoryCollection(values!).Build());

        string? secret = await sut.GetSecretAsync("SECRET_KEY", CancellationToken.None);

        secret.Should().Be("value");
    }

    [Fact]
    public async Task EnvironmentVariableSecretProvider_returns_null_for_missing_key()
    {
        EnvironmentVariableSecretProvider sut = new(new ConfigurationBuilder().Build());

        string? secret = await sut.GetSecretAsync("MISSING", CancellationToken.None);

        secret.Should().BeNull();
    }

    [Fact]
    public void BackgroundJobPersistenceMapper_maps_row_and_unknown_state()
    {
        BackgroundJobRow row = new()
        {
            JobId = "job-1",
            State = "Succeeded",
            CreatedUtc = DateTimeOffset.UtcNow,
            FileName = "out.docx",
            ContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            RetryCount = 1,
            MaxRetries = 3,
        };

        BackgroundJobInfo? mapped = BackgroundJobPersistenceMapper.ToInfo(row);

        mapped.Should().NotBeNull();
        mapped!.JobId.Should().Be("job-1");
        mapped.State.Should().Be(BackgroundJobState.Succeeded);
        BackgroundJobPersistenceMapper.ToInfo(null).Should().BeNull();
        BackgroundJobInfo? unknown = BackgroundJobPersistenceMapper.ToInfo(new BackgroundJobRow { JobId = "x", State = "not-a-state" });
        unknown.Should().NotBeNull();
        unknown!.State.Should().Be(BackgroundJobState.Failed);
    }

    [Fact]
    public void BackgroundJobQueueAddress_resolves_from_blob_uri()
    {
        BackgroundJobsOptions jobs = new();
        ArtifactLargePayloadOptions payload = new()
        {
            AzureBlobServiceUri = "https://acct.blob.core.windows.net",
        };

        Uri? uri = BackgroundJobQueueAddress.ResolveQueueServiceUri(jobs, payload);

        uri.Should().NotBeNull();
        uri!.AbsoluteUri.Should().Contain(".queue.");
    }

    [Fact]
    public void BackgroundJobQueueAddress_prefers_direct_queue_uri()
    {
        BackgroundJobsOptions jobs = new() { QueueServiceUri = "https://acct.queue.core.windows.net" };

        Uri? uri = BackgroundJobQueueAddress.ResolveQueueServiceUri(jobs, null);

        uri!.AbsoluteUri.Should().Be("https://acct.queue.core.windows.net/");
    }

    [Fact]
    public async Task FakeEmailSender_logs_without_throwing()
    {
        FakeEmailSender sut = new(NullLogger<FakeEmailSender>.Instance);

        await sut.Invoking(s => s.SendAsync("user@example.com", "subject", "body", CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public void ReplayDiagnosticsEntry_round_trips_properties()
    {
        ReplayDiagnosticsEntry entry = new()
        {
            TimestampUtc = DateTime.UtcNow,
            ComparisonRecordId = "rec-1",
            ComparisonType = "replay",
            Format = "Markdown",
            ReplayMode = "metadata",
            PersistReplay = true,
            DurationMs = 42,
            Success = true,
            VerificationPassed = false,
            PersistedReplayRecordId = "persisted",
            ErrorMessage = "none",
            MetadataOnly = true,
        };

        entry.ComparisonRecordId.Should().Be("rec-1");
        entry.MetadataOnly.Should().BeTrue();
    }

    [Fact]
    public async Task BlobStorageHealthCheck_reports_healthy_when_blob_offload_disabled()
    {
        ArtifactLargePayloadOptions options = new() { Enabled = false };
        BlobStorageHealthCheck sut = new(
            new TestOptionsMonitor<ArtifactLargePayloadOptions>(options),
            new ServiceCollection().BuildServiceProvider());

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("not enabled");
    }

    [Fact]
    public async Task RunGoldenManifestConsistencyHealthCheck_skips_in_memory_storage()
    {
        MockDbConnectionFactory connectionFactory = new();
        RunGoldenManifestConsistencyHealthCheck sut = new(
            connectionFactory,
            Options.Create(new ArchLucidOptions { StorageProvider = "InMemory" }));

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("InMemory");
    }

    private sealed class TestOptionsMonitor<T>(T value) : IOptionsMonitor<T>
        where T : class
    {
        public T CurrentValue => value;

        public T Get(string? name) => value;

        public IDisposable OnChange(Action<T, string?> listener) => new NoopDisposable();
    }

    private sealed class NoopDisposable : IDisposable
    {
        public void Dispose()
        {
        }
    }

    private sealed class MockDbConnectionFactory : IDbConnectionFactory
    {
        public System.Data.IDbConnection CreateConnection() =>
            throw new NotSupportedException("Not expected for in-memory skip path.");

        public Task<System.Data.IDbConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default) =>
            throw new NotSupportedException("Not expected for in-memory skip path.");
    }
}
