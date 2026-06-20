namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Separates governance-blocking findings from opt-in baseline guidance.
///     <see cref="Advisory" /> findings never block pre-commit gates.
/// </summary>
public enum FindingEnforcementTier
{
    PolicyViolation = 0,
    Advisory = 1,
}
