using ArchLucid.Application.Value;
using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Composition.ValueReports;
using ArchLucid.Persistence.Value;

using FluentAssertions;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.ValueReports;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryValueReportJobQueueDistributedPollStateTests
{
    [Fact]
    public void TryPoll_reports_failure_when_distributed_state_has_unknown_phase()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue pollInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;

        string payload =
            $$"""
              {"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"bogus","bytesBase64":null,"fileName":null,"errorMessage":null}
              """;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(payload),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = pollInstance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryPoll_reports_failure_when_distributed_completed_state_has_invalid_bytes_base64()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue pollInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;

        string payload =
            $$"""
              {"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Completed","bytesBase64":"not-valid-base64!!!","fileName":"report.docx","errorMessage":null}
              """;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(payload),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = pollInstance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryPoll_returns_not_found_when_distributed_state_tenant_does_not_match_scoped_poll()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue pollInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid scopedTenantId = Guid.NewGuid();
        Guid otherTenantId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;

        string payload =
            $$"""
              {"tenantId":"{{otherTenantId}}","workspaceId":"{{Guid.NewGuid()}}","projectId":"{{Guid.NewGuid()}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Completed","bytesBase64":"UEsDBBQ=","fileName":"report.docx","errorMessage":null}
              """;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(payload),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = pollInstance.TryPoll(jobId, scopedTenantId);

        poll.Found.Should().BeFalse();
        poll.Completed.Should().BeFalse();
        poll.DocxBytes.Should().BeNull();
    }

    [Fact]
    public void TryPoll_reports_failure_when_distributed_completed_state_has_no_document_bytes()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue pollInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;

        string payload =
            $$"""
              {"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Completed","bytesBase64":null,"fileName":"report.docx","errorMessage":null}
              """;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(payload),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = pollInstance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().Contain("document is unavailable");
    }

    [Fact]
    public async Task TryPoll_prefers_distributed_terminal_state_over_local_pending()
    {
        TaskCompletionSource<byte[]> renderGate = new();
        ServiceCollection services = BuildValueReportJobServices();
        Mock<IValueReportRenderer> renderer = new();
        renderer
            .Setup(r => r.RenderAsync(It.IsAny<ValueReportSnapshot>(), It.IsAny<CancellationToken>()))
            .Returns(renderGate.Task);
        services.AddSingleton(renderer.Object);

        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue instance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;
        ValueReportJobRequest request = new(tenantId, workspaceId, projectId, from, to);

        Guid jobId = instance.Enqueue(request);

        string payload =
            $$"""
              {"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Failed","bytesBase64":null,"fileName":null,"errorMessage":"Distributed terminal failure."}
              """;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(payload),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = instance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().Contain("Distributed terminal failure");

        renderGate.SetResult([0x50, 0x4B, 0x03, 0x04]);
        await Task.Delay(50);
    }

    [Fact]
    public void TryPoll_reports_failure_copy_when_distributed_failed_state_has_no_error_message()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue pollInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;

        string payload =
            $$"""
              {"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Failed","bytesBase64":null,"fileName":null,"errorMessage":null}
              """;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(payload),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = pollInstance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task TryPoll_on_peer_instance_reports_failure_when_pending_state_cannot_be_persisted()
    {
        ServiceCollection services = BuildValueReportJobServices();
        ThrowOnPendingPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue workerInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);
        InMemoryValueReportJobQueue pollInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        ValueReportJobRequest request = new(
            tenantId,
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddDays(-7),
            DateTimeOffset.UtcNow);

        Guid jobId = workerInstance.Enqueue(request);

        ValueReportJobPollResult? terminal = null;

        for (int attempt = 0; attempt < 20; attempt++)
        {
            ValueReportJobPollResult poll = pollInstance.TryPoll(jobId, tenantId);

            if (poll.Found && poll.ErrorMessage is not null)
            {
                terminal = poll;
                break;
            }

            await Task.Delay(25);
        }

        terminal.Should().NotBeNull();
        terminal!.Found.Should().BeTrue();
        terminal.Completed.Should().BeFalse();
        terminal.ErrorMessage.Should().Contain("poll state could not be persisted");
        pollStateCache.PendingWriteAttempts.Should().BeGreaterThan(0);
        pollStateCache.CompletedWriteAttempts.Should().Be(0);
    }

    [Fact]
    public async Task TryPoll_on_peer_instance_does_not_stay_pending_when_terminal_poll_state_cannot_be_persisted()
    {
        ServiceCollection services = BuildValueReportJobServices();
        ThrowOnTerminalPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue workerInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);
        InMemoryValueReportJobQueue pollInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        ValueReportJobRequest request = new(
            tenantId,
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddDays(-7),
            DateTimeOffset.UtcNow);

        Guid jobId = workerInstance.Enqueue(request);

        ValueReportJobPollResult? workerTerminal = null;

        for (int attempt = 0; attempt < 40; attempt++)
        {
            ValueReportJobPollResult workerPoll = workerInstance.TryPoll(jobId, tenantId);

            if (workerPoll.Found && workerPoll.ErrorMessage is not null)
            {
                workerTerminal = workerPoll;
                break;
            }

            await Task.Delay(25);
        }

        workerTerminal.Should().NotBeNull();

        ValueReportJobPollResult peerPoll = pollInstance.TryPoll(jobId, tenantId);
        peerPoll.Found.Should().BeFalse("stale pending poll state must be cleared when terminal state cannot be persisted");
        pollStateCache.TerminalWriteAttempts.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task TryPoll_on_peer_instance_reports_failure_when_completed_state_cannot_be_persisted()
    {
        ServiceCollection services = BuildValueReportJobServices();
        ThrowOnCompletedPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue workerInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);
        InMemoryValueReportJobQueue pollInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        ValueReportJobRequest request = new(
            tenantId,
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddDays(-7),
            DateTimeOffset.UtcNow);

        Guid jobId = workerInstance.Enqueue(request);

        ValueReportJobPollResult? terminal = null;

        for (int attempt = 0; attempt < 40; attempt++)
        {
            ValueReportJobPollResult poll = pollInstance.TryPoll(jobId, tenantId);

            if (poll.Found && poll.ErrorMessage is not null)
            {
                terminal = poll;
                break;
            }

            await Task.Delay(25);
        }

        terminal.Should().NotBeNull();
        terminal!.Found.Should().BeTrue();
        terminal.Completed.Should().BeFalse();
        terminal.ErrorMessage.Should().Contain("poll state could not be persisted");
        pollStateCache.CompletedWriteAttempts.Should().BeGreaterThan(0);
    }

    private static ServiceCollection BuildValueReportJobServices()
    {
        ServiceCollection services = new();
        Mock<IValueReportMetricsReader> metrics = new();
        metrics
            .Setup(m => m.ReadAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValueReportRawMetrics([], 1, 1, 0, 0, 0, 0, null, null, null, null, 0, null, null, null));
        services.AddSingleton(metrics.Object);
        services.AddSingleton<IOptionsMonitor<ValueReportComputationOptions>>(
            new TestOptionsMonitor<ValueReportComputationOptions>(new ValueReportComputationOptions()));
        services.AddSingleton<ValueReportBuilder>();
        Mock<IValueReportRenderer> renderer = new();
        renderer
            .Setup(r => r.RenderAsync(It.IsAny<ValueReportSnapshot>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([0x50, 0x4B, 0x03, 0x04]);
        services.AddSingleton(renderer.Object);
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        services.AddSingleton(audit.Object);

        return services;
    }

    private sealed class DictionaryPollStateCache : IValueReportJobPollStateCache
    {
        private readonly Dictionary<string, byte[]> _payloads = new(StringComparer.Ordinal);

        public void Set(string key, byte[] payload, DistributedCacheEntryOptions options) => _payloads[key] = payload;

        public byte[]? Get(string key) => _payloads.TryGetValue(key, out byte[]? payload) ? payload : null;

        public void Remove(string key) => _payloads.Remove(key);
    }

    private sealed class ThrowOnPendingPollStateCache : IValueReportJobPollStateCache
    {
        private readonly Dictionary<string, byte[]> _payloads = new(StringComparer.Ordinal);

        public int PendingWriteAttempts { get; private set; }

        public int CompletedWriteAttempts { get; private set; }

        public void Set(string key, byte[] payload, DistributedCacheEntryOptions options)
        {
            string json = System.Text.Encoding.UTF8.GetString(payload);

            if (json.Contains("\"phase\":\"Pending\"", StringComparison.Ordinal))
            {
                PendingWriteAttempts++;

                throw new InvalidOperationException("Simulated distributed cache outage on pending write.");
            }

            if (json.Contains("\"phase\":\"Completed\"", StringComparison.Ordinal))
            {
                CompletedWriteAttempts++;

                throw new InvalidOperationException("Simulated distributed cache outage on completed write.");
            }

            _payloads[key] = payload;
        }

        public byte[]? Get(string key) => _payloads.TryGetValue(key, out byte[]? payload) ? payload : null;

        public void Remove(string key) => _payloads.Remove(key);
    }

    private sealed class ThrowOnTerminalPollStateCache : IValueReportJobPollStateCache
    {
        private readonly Dictionary<string, byte[]> _payloads = new(StringComparer.Ordinal);

        public int TerminalWriteAttempts { get; private set; }

        public void Set(string key, byte[] payload, DistributedCacheEntryOptions options)
        {
            string json = System.Text.Encoding.UTF8.GetString(payload);

            if (json.Contains("\"phase\":\"Pending\"", StringComparison.Ordinal))
            {
                _payloads[key] = payload;

                return;
            }

            if (json.Contains("\"phase\":\"Completed\"", StringComparison.Ordinal)
                || json.Contains("\"phase\":\"Failed\"", StringComparison.Ordinal))
            {
                TerminalWriteAttempts++;

                throw new InvalidOperationException("Simulated distributed cache outage on terminal write.");
            }

            _payloads[key] = payload;
        }

        public byte[]? Get(string key) => _payloads.TryGetValue(key, out byte[]? payload) ? payload : null;

        public void Remove(string key) => _payloads.Remove(key);
    }

    private sealed class ThrowOnCompletedPollStateCache : IValueReportJobPollStateCache
    {
        private readonly Dictionary<string, byte[]> _payloads = new(StringComparer.Ordinal);

        public int CompletedWriteAttempts { get; private set; }

        public void Set(string key, byte[] payload, DistributedCacheEntryOptions options)
        {
            string json = System.Text.Encoding.UTF8.GetString(payload);

            if (json.Contains("\"phase\":\"Completed\"", StringComparison.Ordinal))
            {
                CompletedWriteAttempts++;

                throw new InvalidOperationException("Simulated distributed cache outage on completed write.");
            }

            _payloads[key] = payload;
        }

        public byte[]? Get(string key) => _payloads.TryGetValue(key, out byte[]? payload) ? payload : null;

        public void Remove(string key) => _payloads.Remove(key);
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
}
