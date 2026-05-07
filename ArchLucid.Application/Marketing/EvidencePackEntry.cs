namespace ArchLucid.Application.Marketing;
/// <summary>
///     A single file inside the Trust Center evidence pack.
/// </summary>
/// <param name = "ZipName">File name as it should appear inside the ZIP (no directory components).</param>
/// <param name = "Content">Raw bytes of the file.</param>
public sealed record EvidencePackEntry
{
    public string ZipName { get; init; }
    public byte[] Content { get; init; }

    public EvidencePackEntry(string zipName, byte[] content)
    {
        ZipName = zipName ?? throw new ArgumentNullException(nameof(zipName));
        Content = content ?? throw new ArgumentNullException(nameof(content));
    }
}