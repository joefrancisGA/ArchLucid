namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Grounded prose assumption that did not necessarily become a contradiction finding (DX-61).
///     Contradicted rows reference the emitted declaration-premise-conflict finding id.
/// </summary>
public sealed class ProseAssumptionRegisterEntry
{
    public string Statement
    {
        get;
        set;
    } = string.Empty;

    public string DocumentPath
    {
        get;
        set;
    } = string.Empty;

    public int LineNumber
    {
        get;
        set;
    }

    public string EvidenceRef
    {
        get;
        set;
    } = string.Empty;

    public string? LogicalPropertyName
    {
        get;
        set;
    }

    public ProseAssumptionDisposition Disposition
    {
        get;
        set;
    }

    /// <summary>Required when <see cref="Disposition" /> is <see cref="ProseAssumptionDisposition.Contradicted" />.</summary>
    public string? FindingId
    {
        get;
        set;
    }
}
