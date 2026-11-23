using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class InMemoryTrialPreseedRetryParityTests
{
    [Fact]
    public async Task Cancelled_enqueue_does_not_schedule_a_preseed()
    {
        (InMemoryTenantRepository repository, Guid tenantId) = await CreateTrialAsync();
        using CancellationTokenSource canceled = Canceled();
        Func<Task> operation = () => repository.EnqueueTrialArchitecturePreseedAsync(tenantId, canceled.Token);

        await operation.Should().ThrowAsync<OperationCanceledException>();
        (await repository.GetByIdAsync(tenantId, CancellationToken.None))!
            .TrialArchitecturePreseedEnqueuedUtc.Should().BeNull();
    }

    [Fact]
    public async Task Cancelled_list_does_not_return_pending_preseed_jobs()
    {
        (InMemoryTenantRepository repository, Guid tenantId) = await CreateTrialAsync();
        await repository.EnqueueTrialArchitecturePreseedAsync(tenantId, CancellationToken.None);
        using CancellationTokenSource canceled = Canceled();

        Func<Task> operation = () => repository.ListTenantIdsPendingTrialArchitecturePreseedAsync(
            10, canceled.Token);
        await operation.Should().ThrowAsync<OperationCanceledException>();
        (await repository.ListTenantIdsPendingTrialArchitecturePreseedAsync(10, CancellationToken.None))
            .Should().Contain(tenantId);
    }

    [Fact]
    public async Task Cancelled_complete_does_not_set_the_welcome_run()
    {
        (InMemoryTenantRepository repository, Guid tenantId) = await CreateTrialAsync();
        Guid runId = Guid.NewGuid();
        using CancellationTokenSource canceled = Canceled();

        Func<Task> operation = () => repository.MarkTrialArchitecturePreseedCompletedAsync(
            tenantId, runId, canceled.Token);
        await operation.Should().ThrowAsync<OperationCanceledException>();

        (await repository.GetByIdAsync(tenantId, CancellationToken.None))!
            .TrialWelcomeRunId.Should().BeNull();
        await repository.MarkTrialArchitecturePreseedCompletedAsync(
            tenantId, runId, CancellationToken.None);
        (await repository.GetByIdAsync(tenantId, CancellationToken.None))!
            .TrialWelcomeRunId.Should().Be(runId);
    }

    [Fact]
    public async Task Cancelled_retry_does_not_consume_attempt_or_record_error()
    {
        (InMemoryTenantRepository repository, Guid tenantId) = await CreateTrialAsync();
        using CancellationTokenSource canceled = Canceled();

        Func<Task> operation = () => repository.IncrementTrialArchitecturePreseedAttemptAsync(
            tenantId, "failed", canceled.Token);
        await operation.Should().ThrowAsync<OperationCanceledException>();

        TenantRecord unchanged = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
        unchanged.TrialArchitecturePreseedAttemptCount.Should().Be(0);
        unchanged.TrialArchitecturePreseedLastError.Should().BeNull();
        unchanged.TrialArchitecturePreseedFailedUtc.Should().BeNull();
    }

    [Theory]
    [InlineData("  network unavailable  ", "network unavailable")]
    [InlineData("   ", "unknown")]
    [InlineData("", "unknown")]
    public async Task Retry_error_matches_sql_whitespace_normalization(string error, string expected)
    {
        (InMemoryTenantRepository repository, Guid tenantId) = await CreateTrialAsync();

        int count = await repository.IncrementTrialArchitecturePreseedAttemptAsync(
            tenantId, error, CancellationToken.None);

        count.Should().Be(1);
        TenantRecord row = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
        row.TrialArchitecturePreseedAttemptCount.Should().Be(1);
        row.TrialArchitecturePreseedLastError.Should().Be(expected);
    }

    [Fact]
    public async Task Oversized_retry_error_is_bounded_to_2048_characters()
    {
        (InMemoryTenantRepository repository, Guid tenantId) = await CreateTrialAsync();
        string oversized = " " + new string('E', 4096) + " ";

        await repository.IncrementTrialArchitecturePreseedAttemptAsync(
            tenantId, oversized, CancellationToken.None);

        TenantRecord row = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
        row.TrialArchitecturePreseedLastError.Should().HaveLength(2048);
        row.TrialArchitecturePreseedLastError.Should().Be(new string('E', 2048));
    }

    [Fact]
    public async Task Fifth_attempt_retains_normalized_error_and_terminal_failure()
    {
        (InMemoryTenantRepository repository, Guid tenantId) = await CreateTrialAsync();

        for (int attempt = 1; attempt <= 5; attempt++)
            (await repository.IncrementTrialArchitecturePreseedAttemptAsync(
                tenantId, "  failure  ", CancellationToken.None)).Should().Be(attempt);

        TenantRecord row = (await repository.GetByIdAsync(tenantId, CancellationToken.None))!;
        row.TrialArchitecturePreseedAttemptCount.Should().Be(5);
        row.TrialArchitecturePreseedFailedUtc.Should().NotBeNull();
        row.TrialArchitecturePreseedLastError.Should().Be("failure");
    }

    private static CancellationTokenSource Canceled()
    {
        CancellationTokenSource source = new();
        source.Cancel();
        return source;
    }

    private static async Task<(InMemoryTenantRepository Repository, Guid TenantId)> CreateTrialAsync()
    {
        InMemoryTenantRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        await repository.InsertTenantAsync(
            tenantId, "Preseed parity", "preseed-" + tenantId.ToString("N")[..12],
            TenantTier.Standard, null, TenantDataRegions.Default, CancellationToken.None);

        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        await repository.CommitSelfServiceTrialAsync(
            tenantId, now.AddMinutes(-10), now.AddDays(7),
            runsLimit: 10, seatsLimit: 2, sampleRunId: Guid.NewGuid(),
            baselineReviewCycleHours: null,
            baselineReviewCycleSource: null,
            baselineReviewCycleCapturedUtc: null,
            companySize: null,
            architectureTeamSize: null,
            industryVertical: null,
            industryVerticalOther: null,
            CancellationToken.None);
        return (repository, tenantId);
    }
}
