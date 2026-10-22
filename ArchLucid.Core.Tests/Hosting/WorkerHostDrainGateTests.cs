using ArchLucid.Core.Hosting;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Category", "Unit")]
public sealed class WorkerHostDrainGateTests
{
    [Fact]
    public void BeginDrain_sets_IsDraining_true_idempotently()
    {
        WorkerHostDrainGate sut = new();

        sut.IsDraining.Should().BeFalse();

        sut.BeginDrain();
        sut.IsDraining.Should().BeTrue();

        sut.BeginDrain();
        sut.IsDraining.Should().BeTrue();
    }
}
