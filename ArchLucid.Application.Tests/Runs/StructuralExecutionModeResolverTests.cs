using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StructuralExecutionModeResolverTests
{
    [Fact]
    public void FromAgentExecutionOptionsAndFallback_prefers_fallback_when_flag_set()
    {
        StructuralExecutionMode mode = StructuralExecutionModeResolver.FromAgentExecutionOptionsAndFallback(
            new AgentExecutionOptions { Mode = "Real" },
            realModeFellBackToSimulator: true);

        mode.Should().Be(StructuralExecutionMode.Fallback);
    }

    [Fact]
    public void FromAgentExecutionOptionsAndFallback_maps_real_mode_without_fallback()
    {
        StructuralExecutionMode mode = StructuralExecutionModeResolver.FromAgentExecutionOptionsAndFallback(
            new AgentExecutionOptions { Mode = "Real" },
            realModeFellBackToSimulator: false);

        mode.Should().Be(StructuralExecutionMode.Real);
    }

    [Fact]
    public void FromAgentExecutionOptionsAndFallback_defaults_to_simulator()
    {
        StructuralExecutionMode mode = StructuralExecutionModeResolver.FromAgentExecutionOptionsAndFallback(
            new AgentExecutionOptions { Mode = "Simulator" },
            realModeFellBackToSimulator: false);

        mode.Should().Be(StructuralExecutionMode.Simulator);
    }
}
