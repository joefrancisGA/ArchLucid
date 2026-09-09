namespace ArchLucid.ContextIngestion.Parsing;

/// <summary>
///     Machine-readable context-ingestion warnings for pixel-only diagram sources (AS-005).
/// </summary>
public static class PixelDiagramNotVerifiableWarnings
{
    public const string Prefix = "pixel-diagram-not-verifiable:";

    public static string Format(PixelDiagramIntakeStubMetadata metadata)
    {
        ArgumentNullException.ThrowIfNull(metadata);

        string evidenceToken = string.IsNullOrWhiteSpace(metadata.EvidenceItemId)
            ? "none"
            : metadata.EvidenceItemId.Trim();

        string pendingToken = string.IsNullOrWhiteSpace(metadata.PendingStoredFileMarker)
            ? "none"
            : metadata.PendingStoredFileMarker.Trim();

        return
            $"{Prefix}file={metadata.FileName};mime={metadata.SourceMimeType};evidenceItemId={evidenceToken};pending={pendingToken}";
    }
}
