using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.Findings;

/// <summary>Held-check ask derived from a NotVerifiable prose assumption register row (DX-66).</summary>
public sealed class ProseAssumptionHeldCheckAsk
{
    public HeldCheckInputCode InputCode
    {
        get;
        set;
    }

    public string Statement
    {
        get;
        set;
    } = string.Empty;

    public string EvidenceRef
    {
        get;
        set;
    } = string.Empty;
}
