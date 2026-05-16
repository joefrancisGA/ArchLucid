namespace ArchLucid.Application.Exports;

/// <summary>
///     Generated export payload returned from <see cref="IArchitectureReviewExportService" />.
/// </summary>
/// <remarks>Caller must dispose <see cref="Content" />.</remarks>
public sealed record ExportResult(Stream Content, string ContentType, string FileName);
