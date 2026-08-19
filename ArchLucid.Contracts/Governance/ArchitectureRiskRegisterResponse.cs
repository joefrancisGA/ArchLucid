namespace ArchLucid.Contracts.Governance;

/// <summary>Architecture risk register payload (TB-057).</summary>
public sealed class ArchitectureRiskRegisterResponse
{
    public IReadOnlyList<ArchitectureRiskRegisterEntry> Entries
    {
        get;
        init;
    } = [];
}
