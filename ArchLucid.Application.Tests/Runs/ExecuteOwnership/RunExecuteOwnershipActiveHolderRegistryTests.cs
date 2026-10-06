using ArchLucid.Application.Runs.ExecuteOwnership;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.ExecuteOwnership;

[Trait("Category", "Unit")]
public sealed class RunExecuteOwnershipActiveHolderRegistryTests
{
    [Fact]
    public void TryAdmit_second_call_for_same_run_returns_false()
    {
        RunExecuteOwnershipActiveHolderRegistry registry = new();
        Guid runId = Guid.NewGuid();

        registry.TryAdmit(runId, "instance-a").Should().BeTrue();
        registry.Contains(runId).Should().BeTrue();
        registry.TryAdmit(runId, "instance-b").Should().BeFalse();
        registry.TryGetHolder(runId, out string? holder).Should().BeTrue();
        holder.Should().Be("instance-a");
        registry.HolderInstanceIds.Should().Equal("instance-a");
    }

    [Fact]
    public void TryAdmit_rejects_blank_holder()
    {
        RunExecuteOwnershipActiveHolderRegistry registry = new();

        Action act = () => registry.TryAdmit(Guid.NewGuid(), " ");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void TryRemove_and_clear_drop_admitted_runs()
    {
        RunExecuteOwnershipActiveHolderRegistry registry = new();
        Guid runId = Guid.NewGuid();
        registry.TryAdmit(runId, "instance-a");

        registry.TryRemove(runId).Should().BeTrue();
        registry.Contains(runId).Should().BeFalse();
        registry.TryGetHolder(runId, out string? missing).Should().BeFalse();
        missing.Should().BeNull();

        registry.TryAdmit(Guid.NewGuid(), "instance-a");
        registry.Clear();
        registry.HolderInstanceIds.Should().BeEmpty();
    }
}
