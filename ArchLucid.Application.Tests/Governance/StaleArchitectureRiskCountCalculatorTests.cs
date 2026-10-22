using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
public sealed class StaleArchitectureRiskCountCalculatorTests
{
    [Fact]
    public void CountStale_counts_register_rows_marked_stale()
    {
        ArchitectureRiskRegisterResponse register = new()
        {
            Entries =
            [
                new ArchitectureRiskRegisterEntry { IsStale = true },
                new ArchitectureRiskRegisterEntry { IsStale = false },
                new ArchitectureRiskRegisterEntry { IsStale = true },
            ],
        };

        StaleArchitectureRiskCountCalculator.CountStale(register).Should().Be(2);
    }
}
