namespace ArchLucid.Application.Analysis;

/// <summary>Shared omission copy for evidence request fields in architecture analysis exports.</summary>
internal static class ArchitectureEvidenceRequestExport
{
    internal const string MissingDescriptionCopy = "Request description was not stored.";

    internal static string FormatDescription(string? description) =>
        string.IsNullOrWhiteSpace(description) ? MissingDescriptionCopy : description;
}
