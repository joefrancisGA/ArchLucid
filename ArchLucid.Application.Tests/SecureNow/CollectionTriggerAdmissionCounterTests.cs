using ArchLucid.Application.SecureNow;

using FluentAssertions;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CollectionTriggerAdmissionCounterTests
{
    [Fact]
    public void Increment_and_decrement_are_symmetric()
    {
        CollectionTriggerAdmissionCounter counter = new();

        counter.Increment().Should().Be(1);
        counter.Increment().Should().Be(2);
        counter.Current.Should().Be(2);
        counter.Decrement().Should().Be(1);
        counter.Decrement().Should().Be(0);
        counter.Current.Should().Be(0);
    }

    [Fact]
    public void Increment_is_shared_across_parallel_callers()
    {
        CollectionTriggerAdmissionCounter counter = new();
        const int callers = 200;

        Parallel.For(0, callers, _ => counter.Increment());
        counter.Current.Should().Be(callers);

        int last = 0;

        for (int i = 0; i < callers; i++)
            last = counter.Decrement();

        last.Should().Be(0);
        counter.Current.Should().Be(0);
    }
}
