using FluentAssertions;

namespace ArchLucid.ReviewApiHarness.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RealAiExecutionGateTests
{
    [Fact]
    public void Evaluate_passes_for_real_mode_with_tokens()
    {
        ResponseValidationResult result = RealAiExecutionGate.Evaluate("Real", false, 120);

        result.Passed.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public void Evaluate_fails_for_simulator()
    {
        ResponseValidationResult result = RealAiExecutionGate.Evaluate("Simulator", false, 10);

        result.Passed.Should().BeFalse();
        result.Errors.Should().Contain(static e => e.Contains("structuralExecutionMode", StringComparison.Ordinal));
    }

    [Fact]
    public void Evaluate_fails_when_tokens_zero()
    {
        ResponseValidationResult result = RealAiExecutionGate.Evaluate("Real", false, 0);

        result.Passed.Should().BeFalse();
        result.Errors.Should().Contain(static e => e.Contains("token", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Evaluate_fails_when_fell_back_to_simulator()
    {
        ResponseValidationResult result = RealAiExecutionGate.Evaluate("Real", true, 50);

        result.Passed.Should().BeFalse();
        result.Errors.Should().Contain(static e => e.Contains("realModeFellBackToSimulator", StringComparison.Ordinal));
    }
}
