namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Pinned extractor evidence identity for authority findings (wave-4 suggestion 32).
/// </summary>
public sealed class EvidencePackagePin
{
    public Guid? PackageId
    {
        get;
        init;
    }

    public DateTime? CollectionUtc
    {
        get;
        init;
    }

    public string Provider
    {
        get;
        init;
    } = string.Empty;
}
