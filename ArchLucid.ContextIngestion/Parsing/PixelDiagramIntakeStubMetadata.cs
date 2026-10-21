namespace ArchLucid.ContextIngestion.Parsing;

public sealed record PixelDiagramIntakeStubMetadata(
    string FileName,
    string SourceMimeType,
    string? EvidenceItemId,
    string? PendingStoredFileMarker);
