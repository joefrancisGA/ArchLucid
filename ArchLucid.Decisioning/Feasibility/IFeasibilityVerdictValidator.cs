using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Decisioning.Feasibility;

/// <summary>Citation gate and shape validation for <see cref="FeasibilityVerdict" /> (ADR 0050).</summary>
public interface IFeasibilityVerdictValidator
{
    /// <summary>
    ///     Throws <see cref="InvalidOperationException" /> when the verdict violates ADR 0050 constraints
    ///     (e.g. hard verdict without citation).
    /// </summary>
    void Validate(FeasibilityVerdict verdict);
}
