using ArchLucid.Contracts.Advisory.Delivery;
using ArchLucid.Contracts.Advisory.Scheduling;
using ArchLucid.Persistence.Advisory;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Advisory;

[Trait("Category", "Unit")]
public sealed class InMemoryAdvisoryRepositoryCoverageTests
{
    [Fact]
    public async Task Advisory_scan_execution_repository_lists_by_schedule()
    {
        InMemoryAdvisoryScanExecutionRepository sut = new();
        Guid scheduleId = Guid.NewGuid();
        AdvisoryScanExecution older = new()
        {
            ScheduleId = scheduleId,
            StartedUtc = DateTime.UtcNow.AddHours(-2),
            Status = "Completed",
        };
        AdvisoryScanExecution newer = new()
        {
            ScheduleId = scheduleId,
            StartedUtc = DateTime.UtcNow.AddHours(-1),
            Status = "Completed",
        };

        await sut.CreateAsync(older, CancellationToken.None);
        await sut.CreateAsync(newer, CancellationToken.None);

        IReadOnlyList<AdvisoryScanExecution> listed =
            await sut.ListByScheduleAsync(scheduleId, take: 10, CancellationToken.None);

        listed.Should().HaveCount(2);
        listed[0].ExecutionId.Should().Be(newer.ExecutionId);
    }

    [Fact]
    public async Task Advisory_scan_execution_repository_updates_existing_row()
    {
        InMemoryAdvisoryScanExecutionRepository sut = new();
        AdvisoryScanExecution execution = new()
        {
            Status = "Started",
            ResultJson = "{}",
        };

        await sut.CreateAsync(execution, CancellationToken.None);
        execution.Status = "Completed";
        execution.ResultJson = """{"findings":1}""";

        await sut.UpdateAsync(execution, CancellationToken.None);

        IReadOnlyList<AdvisoryScanExecution> listed =
            await sut.ListByScheduleAsync(execution.ScheduleId, take: 1, CancellationToken.None);

        listed.Should().ContainSingle();
        listed[0].Status.Should().Be("Completed");
        listed[0].ResultJson.Should().Contain("findings");
    }

    [Fact]
    public async Task Digest_delivery_attempt_repository_lists_by_digest_and_subscription()
    {
        InMemoryDigestDeliveryAttemptRepository sut = new();
        Guid digestId = Guid.NewGuid();
        Guid subscriptionId = Guid.NewGuid();

        DigestDeliveryAttempt first = new()
        {
            DigestId = digestId,
            SubscriptionId = subscriptionId,
            ChannelType = "email",
            Destination = "a@example.com",
            AttemptedUtc = DateTime.UtcNow.AddMinutes(-5),
            Status = DigestDeliveryStatus.Succeeded,
        };

        DigestDeliveryAttempt second = new()
        {
            DigestId = digestId,
            SubscriptionId = subscriptionId,
            ChannelType = "email",
            Destination = "a@example.com",
            AttemptedUtc = DateTime.UtcNow,
            Status = DigestDeliveryStatus.Failed,
            ErrorMessage = "smtp timeout",
        };

        await sut.CreateAsync(first, CancellationToken.None);
        await sut.CreateAsync(second, CancellationToken.None);

        IReadOnlyList<DigestDeliveryAttempt> byDigest =
            await sut.ListByDigestAsync(digestId, CancellationToken.None);

        byDigest.Should().HaveCount(2);
        byDigest[0].AttemptId.Should().Be(second.AttemptId);

        IReadOnlyList<DigestDeliveryAttempt> byDigestIds =
            await sut.ListByDigestIdsAsync(
                [digestId, Guid.NewGuid()],
                tenantId: Guid.Empty,
                workspaceId: Guid.Empty,
                projectId: Guid.Empty,
                CancellationToken.None);

        byDigestIds.Should().HaveCount(2);
        byDigestIds.Select(a => a.AttemptId).Should().BeEquivalentTo(byDigest.Select(a => a.AttemptId));

        IReadOnlyList<DigestDeliveryAttempt> bySubscription =
            await sut.ListBySubscriptionAsync(subscriptionId, take: 10, CancellationToken.None);

        bySubscription.Should().HaveCount(2);
    }
}
