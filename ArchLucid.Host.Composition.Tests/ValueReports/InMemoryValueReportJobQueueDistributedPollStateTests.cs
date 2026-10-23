using System.Reflection;

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
    public void TryPoll_reports_failure_when_distributed_state_json_missing_report_window()
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

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(
                $$"""{"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","phase":"Pending"}"""),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = pollInstance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryPoll_reports_failure_when_distributed_state_json_missing_project_id()
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
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(
                $$"""{"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Pending"}"""),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = pollInstance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryPoll_reports_failure_when_distributed_state_json_missing_workspace_id()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue pollInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(
                $$"""{"tenantId":"{{tenantId}}","phase":"Pending"}"""),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = pollInstance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryPoll_reports_failure_when_distributed_state_json_missing_tenant_id()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue pollInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes("""{"phase":"Pending"}"""),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = pollInstance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryPoll_propagates_operation_canceled_when_distributed_cache_read_is_canceled()
    {
        ServiceCollection services = BuildValueReportJobServices();
        ThrowOperationCanceledOnGetPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue pollInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();

        Action act = () => pollInstance.TryPoll(jobId, tenantId);

        act.Should().Throw<OperationCanceledException>();
    }

    [Fact]
    public void TryPoll_reports_failure_when_distributed_state_cache_read_throws()
    {
        ServiceCollection services = BuildValueReportJobServices();
        ThrowOnGetPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue pollInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();

        ValueReportJobPollResult poll = pollInstance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryPoll_reports_failure_when_distributed_state_has_inverted_report_window()
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
        DateTimeOffset from = DateTimeOffset.UtcNow;
        DateTimeOffset to = DateTimeOffset.UtcNow.AddDays(-7);

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(
                $$"""{"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Pending"}"""),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = pollInstance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryPoll_reports_failure_when_distributed_state_payload_is_invalid_json()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue pollInstance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes("{not-valid-json"),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = pollInstance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryPoll_reports_failure_when_distributed_state_corrupt_and_local_job_is_pending()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue queue =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;
        ValueReportJobRequest request = new(tenantId, workspaceId, projectId, from, to);

        ReplaceLocalJobEntry(queue, jobId, request, "Pending", null, null, null);

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes("{not-valid-json"),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = queue.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().NotBeNullOrWhiteSpace();
    }

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
    public async Task TryPoll_prefers_distributed_completed_bytes_when_local_completed_has_no_document()
    {
        ServiceCollection services = BuildValueReportJobServices();
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

        for (int attempt = 0; attempt < 40; attempt++)
        {
            ValueReportJobPollResult poll = instance.TryPoll(jobId, tenantId);

            if (poll.Completed && poll.DocxBytes is not null)
                break;

            await Task.Delay(25);
        }

        ReplaceLocalJobBytes(instance, jobId, null);

        ValueReportJobPollResult recovered = instance.TryPoll(jobId, tenantId);

        recovered.Found.Should().BeTrue();
        recovered.Completed.Should().BeTrue();
        recovered.DocxBytes.Should().NotBeEmpty();
    }

    [Fact]
    public void TryPoll_keeps_local_completed_bytes_when_distributed_is_pending()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue instance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;
        ValueReportJobRequest request = new(tenantId, workspaceId, projectId, from, to);
        byte[] docxBytes = [0x50, 0x4B, 0x03, 0x04];

        ReplaceLocalJobEntry(
            instance,
            jobId,
            request,
            "Completed",
            docxBytes,
            "report.docx",
            null);

        string payload =
            $$"""
              {"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Pending","bytesBase64":null,"fileName":"report.docx","errorMessage":null}
              """;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(payload),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = instance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeTrue();
        poll.DocxBytes.Should().Equal(docxBytes);
    }

    [Fact]
    public void TryPoll_keeps_local_completed_bytes_when_distributed_is_failed()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue instance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;
        ValueReportJobRequest request = new(tenantId, workspaceId, projectId, from, to);
        byte[] docxBytes = [0x50, 0x4B, 0x03, 0x04];

        ReplaceLocalJobEntry(
            instance,
            jobId,
            request,
            "Completed",
            docxBytes,
            "report.docx",
            null);

        string payload =
            $$"""
              {"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Failed","bytesBase64":null,"fileName":"report.docx","errorMessage":"Stale distributed failure."}
              """;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(payload),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = instance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeTrue();
        poll.DocxBytes.Should().Equal(docxBytes);
    }

    [Fact]
    public void TryPoll_keeps_local_completed_bytes_when_distributed_state_is_corrupt()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue instance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;
        ValueReportJobRequest request = new(tenantId, workspaceId, projectId, from, to);
        byte[] docxBytes = [0x50, 0x4B, 0x03, 0x04];

        ReplaceLocalJobEntry(
            instance,
            jobId,
            request,
            "Completed",
            docxBytes,
            "report.docx",
            null);

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes("{not-valid-json"),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = instance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeTrue();
        poll.DocxBytes.Should().Equal(docxBytes);
    }

    [Fact]
    public void TryPoll_prefers_distributed_pending_when_local_completed_has_no_document_bytes()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue instance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;
        ValueReportJobRequest request = new(tenantId, workspaceId, projectId, from, to);

        ReplaceLocalJobEntry(
            instance,
            jobId,
            request,
            "Completed",
            null,
            "report.docx",
            null);

        string payload =
            $$"""
              {"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Pending","bytesBase64":null,"fileName":"report.docx","errorMessage":null}
              """;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(payload),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = instance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().BeNull();
    }

    [Fact]
    public void TryPoll_prefers_distributed_completed_bytes_when_local_is_failed()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue instance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;
        ValueReportJobRequest request = new(tenantId, workspaceId, projectId, from, to);
        byte[] docxBytes = [0x50, 0x4B, 0x03, 0x04];

        ReplaceLocalJobEntry(
            instance,
            jobId,
            request,
            "Failed",
            null,
            "report.docx",
            "Stale local failure after distributed completion.");

        string payload =
            $$"""
              {"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Completed","bytesBase64":"{{Convert.ToBase64String(docxBytes)}}","fileName":"report.docx","errorMessage":null}
              """;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(payload),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = instance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeTrue();
        poll.DocxBytes.Should().Equal(docxBytes);
    }

    [Fact]
    public void TryPoll_prefers_distributed_completed_when_local_is_failed_and_remote_has_no_document_bytes()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue instance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;
        ValueReportJobRequest request = new(tenantId, workspaceId, projectId, from, to);

        ReplaceLocalJobEntry(
            instance,
            jobId,
            request,
            "Failed",
            null,
            "report.docx",
            "Stale local failure after distributed completion without bytes.");

        string payload =
            $$"""
              {"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Completed","bytesBase64":null,"fileName":"report.docx","errorMessage":null}
              """;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(payload),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = instance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().Be(
            "Value report job completed but the document is unavailable — retry the async export.");
    }

    [Fact]
    public void TryPoll_prefers_distributed_failed_error_when_local_is_failed()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue instance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;
        ValueReportJobRequest request = new(tenantId, workspaceId, projectId, from, to);
        const string distributedError = "Value report render failed on peer replica.";

        ReplaceLocalJobEntry(
            instance,
            jobId,
            request,
            "Failed",
            null,
            "report.docx",
            "Stale local enqueue failure.");

        string payload =
            $$"""
              {"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Failed","bytesBase64":null,"fileName":"report.docx","errorMessage":"{{distributedError}}"}
              """;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(payload),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = instance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().Be(distributedError);
    }

    [Fact]
    public void TryPoll_prefers_distributed_failure_when_local_completed_has_no_document_bytes()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue instance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;
        ValueReportJobRequest request = new(tenantId, workspaceId, projectId, from, to);

        ReplaceLocalJobEntry(
            instance,
            jobId,
            request,
            "Completed",
            null,
            "report.docx",
            null);

        string payload =
            $$"""
              {"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Failed","bytesBase64":null,"fileName":"report.docx","errorMessage":"Distributed failure after corrupt local state."}
              """;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(payload),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = instance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().Contain("Distributed failure after corrupt local state");
    }

    [Fact]
    public void TryPoll_keeps_local_pending_when_distributed_completed_has_no_document_bytes()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue instance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;
        ValueReportJobRequest request = new(tenantId, workspaceId, projectId, from, to);

        ReplaceLocalJobEntry(
            instance,
            jobId,
            request,
            "Pending",
            null,
            "report.docx",
            null);

        string payload =
            $$"""
              {"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Completed","bytesBase64":null,"fileName":"report.docx","errorMessage":null}
              """;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(payload),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = instance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeFalse();
        poll.ErrorMessage.Should().BeNull();
    }

    [Fact]
    public void TryPoll_prefers_distributed_completed_bytes_when_local_is_pending()
    {
        ServiceCollection services = BuildValueReportJobServices();
        DictionaryPollStateCache pollStateCache = new();
        services.AddSingleton<IValueReportJobPollStateCache>(pollStateCache);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        InMemoryValueReportJobQueue instance =
            new(scopeFactory, pollStateCache, NullLogger<InMemoryValueReportJobQueue>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid jobId = Guid.NewGuid();
        DateTimeOffset from = DateTimeOffset.UtcNow.AddDays(-7);
        DateTimeOffset to = DateTimeOffset.UtcNow;
        ValueReportJobRequest request = new(tenantId, workspaceId, projectId, from, to);
        byte[] docxBytes = [0x50, 0x4B, 0x03, 0x04];

        ReplaceLocalJobEntry(
            instance,
            jobId,
            request,
            "Pending",
            null,
            "report.docx",
            null);

        string payload =
            $$"""
              {"tenantId":"{{tenantId}}","workspaceId":"{{workspaceId}}","projectId":"{{projectId}}","fromUtcInclusive":"{{from:O}}","toUtcExclusive":"{{to:O}}","phase":"Completed","bytesBase64":"{{Convert.ToBase64String(docxBytes)}}","fileName":"report.docx","errorMessage":null}
              """;

        pollStateCache.Set(
            $"archlucid:value-report-job:{jobId:N}",
            System.Text.Encoding.UTF8.GetBytes(payload),
            new DistributedCacheEntryOptions());

        ValueReportJobPollResult poll = instance.TryPoll(jobId, tenantId);

        poll.Found.Should().BeTrue();
        poll.Completed.Should().BeTrue();
        poll.DocxBytes.Should().Equal(docxBytes);
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

    private sealed class ThrowOperationCanceledOnGetPollStateCache : IValueReportJobPollStateCache
    {
        public void Set(string key, byte[] payload, DistributedCacheEntryOptions options)
        {
        }

        public byte[]? Get(string key) => throw new OperationCanceledException();

        public void Remove(string key)
        {
        }
    }

    private sealed class ThrowOnGetPollStateCache : IValueReportJobPollStateCache
    {
        public void Set(string key, byte[] payload, DistributedCacheEntryOptions options)
        {
        }

        public byte[]? Get(string key) =>
            throw new InvalidOperationException("Simulated distributed cache read failure.");

        public void Remove(string key)
        {
        }
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

    private static void ReplaceLocalJobBytes(InMemoryValueReportJobQueue queue, Guid jobId, byte[]? bytes)
    {
        object jobs = GetJobsDictionary(queue);
        object existing = GetJobEntry(jobs, jobId);
        SetJobEntry(jobs, jobId, CreateJobEntryFromExisting(existing, bytes));
    }

    private static void ReplaceLocalJobEntry(
        InMemoryValueReportJobQueue queue,
        Guid jobId,
        ValueReportJobRequest request,
        string phaseName,
        byte[]? bytes,
        string? fileName,
        string? errorMessage)
    {
        SetJobEntry(GetJobsDictionary(queue), jobId, CreateJobEntry(request, phaseName, bytes, fileName, errorMessage));
    }

    private static object GetJobsDictionary(InMemoryValueReportJobQueue queue)
    {
        FieldInfo field = typeof(InMemoryValueReportJobQueue).GetField(
            "_jobs",
            BindingFlags.Instance | BindingFlags.NonPublic)
            ?? throw new InvalidOperationException("_jobs field not found.");

        return field.GetValue(queue)!;
    }

    private static object GetJobEntry(object jobs, Guid jobId) =>
        jobs.GetType().GetProperty("Item")!.GetValue(jobs, [jobId])
        ?? throw new InvalidOperationException("Local job entry was not found.");

    private static void SetJobEntry(object jobs, Guid jobId, object entry) =>
        jobs.GetType().GetProperty("Item")!.SetValue(jobs, entry, [jobId]);

    private static object CreateJobEntryFromExisting(object existing, byte[]? bytes)
    {
        Type entryType = existing.GetType();
        ValueReportJobRequest request = (ValueReportJobRequest)entryType.GetProperty("Request")!.GetValue(existing)!;
        object phase = entryType.GetProperty("Phase")!.GetValue(existing)!;
        string? fileName = (string?)entryType.GetProperty("FileName")!.GetValue(existing);
        string? errorMessage = (string?)entryType.GetProperty("ErrorMessage")!.GetValue(existing);

        return Activator.CreateInstance(entryType, request, phase, bytes, fileName, errorMessage)!;
    }

    private static object CreateJobEntry(
        ValueReportJobRequest request,
        string phaseName,
        byte[]? bytes,
        string? fileName,
        string? errorMessage)
    {
        Type queueType = typeof(InMemoryValueReportJobQueue);
        Type entryType = queueType.GetNestedType("JobEntry", BindingFlags.NonPublic)
            ?? throw new InvalidOperationException("JobEntry type not found.");
        Type phaseType = queueType.GetNestedType("JobPhase", BindingFlags.NonPublic)
            ?? throw new InvalidOperationException("JobPhase type not found.");
        object phase = Enum.Parse(phaseType, phaseName);

        return Activator.CreateInstance(entryType, request, phase, bytes, fileName, errorMessage)!;
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
