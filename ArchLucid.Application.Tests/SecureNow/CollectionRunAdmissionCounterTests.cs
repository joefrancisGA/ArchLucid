using ArchLucid.Application.SecureNow;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CollectionRunAdmissionCounterTests
{
    [Fact]
    public void Increment_then_decrement_returns_to_zero()
    {
        CollectionRunAdmissionCounter counter = new();

        Assert.Equal(1, counter.IncrementWaiting());
        Assert.Equal(2, counter.IncrementWaiting());
        Assert.Equal(1, counter.DecrementWaiting());
        Assert.Equal(0, counter.DecrementWaiting());
    }

    [Fact]
    public void Distinct_instances_do_not_share_counts()
    {
        CollectionRunAdmissionCounter first = new();
        CollectionRunAdmissionCounter second = new();

        first.IncrementWaiting();

        Assert.Equal(1, second.IncrementWaiting());
    }
}
