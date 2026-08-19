namespace ArchLucid.Contracts.Governance;

/// <summary>Cross-review decision register (TB-060).</summary>
public sealed class ArchitectureDecisionRegisterResponse
{
    public IReadOnlyList<ArchitectureDecisionRegisterEntry> Decisions
    {
        get;
        init;
    } = [];
}
