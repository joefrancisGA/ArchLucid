using ArchLucid.Application.SecureNow;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CollectionTriggerAdmissionCounterTests
{
    [Fact]
    public void Increment_then_decrement_returns_to_zero()
    {
        CollectionTriggerAdmissionCounter counter = new();

        Assert.Equal(1, counter.Increment());
        Assert.Equal(2, counter.Increment());
        Assert.Equal(1, counter.Decrement());
        Assert.Equal(0, counter.Decrement());
    }
}
