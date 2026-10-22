using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Interfaces;

/// <summary>TB-1221 / LP-02: structural provenance gate for decision-grade finding emission.</summary>
public interface IFindingProvenanceValidator
{
    /// <summary>Returns a violation message when decision-grade emission is not allowed; otherwise null.</summary>
    string? GetEmissionViolation(Finding finding);
}
