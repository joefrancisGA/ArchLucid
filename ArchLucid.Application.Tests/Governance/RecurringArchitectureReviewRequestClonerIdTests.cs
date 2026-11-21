using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RecurringArchitectureReviewRequestClonerIdTests
{
    [Fact]
    public void DistinctTriggerInstantsWithinOneSecondProduceDistinctRequestIds()
    {
        ArchitectureRequest source = new() { Description = "Test recurrence request." };
        Guid prior = Guid.Parse("12345678-1234-1234-1234-123456789abc");
        DateTimeOffset instant = new(2026, 11, 20, 10, 20, 30, TimeSpan.Zero);

        ArchitectureRequest first = RecurringArchitectureReviewRequestCloner.CloneForRecurrence(source, prior, instant);
        ArchitectureRequest second = RecurringArchitectureReviewRequestCloner.CloneForRecurrence(
            source, prior, instant.AddTicks(1));

        Assert.NotEqual(first.RequestId, second.RequestId);
        Assert.True(first.RequestId.Length <= 64);
        Assert.True(second.RequestId.Length <= 64);
    }

    [Fact]
    public void EquivalentUtcInstantsRemainIdempotentAcrossOffsets()
    {
        ArchitectureRequest source = new() { Description = "Test recurrence request." };
        Guid prior = Guid.NewGuid();
        DateTimeOffset instant = new(2026, 11, 20, 10, 20, 30, TimeSpan.Zero);
        ArchitectureRequest utc = RecurringArchitectureReviewRequestCloner.CloneForRecurrence(source, prior, instant);
        ArchitectureRequest offset = RecurringArchitectureReviewRequestCloner.CloneForRecurrence(
            source, prior, instant.ToOffset(TimeSpan.FromHours(-5)));
        Assert.Equal(utc.RequestId, offset.RequestId);
    }
}
