using System.Text.Json;

using ArchLucid.Contracts.Persistence.Context;

namespace ArchLucid.ContextIngestion.Parsing;

/// <summary>
///     Detects AS-004 pixel diagram intake stubs in structured diagram JSON documents.
/// </summary>
public static class PixelDiagramIntakeStubDetector
{
    private const string PixelStubKind = "pixel-diagram-not-verifiable";

    public static bool TryDetect(
        ContextDocumentReference document,
        out PixelDiagramIntakeStubMetadata metadata)
    {
        ArgumentNullException.ThrowIfNull(document);
        metadata = default!;

        if (!string.Equals(
                document.ContentType?.Trim(),
                SupportedContextDocumentContentTypes.StructuredDiagramJson,
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(document.Content))
        {
            return false;
        }

        try
        {
            using JsonDocument json = JsonDocument.Parse(document.Content);
            JsonElement root = json.RootElement;

            if (!root.TryGetProperty("intakeStub", out JsonElement intakeStub))
            {
                return false;
            }

            if (!intakeStub.TryGetProperty("kind", out JsonElement kindElement))
            {
                return false;
            }

            string? kind = kindElement.GetString();

            if (!string.Equals(kind, PixelStubKind, StringComparison.Ordinal))
            {
                return false;
            }

            string sourceMimeType = intakeStub.TryGetProperty("sourceMimeType", out JsonElement mimeElement)
                ? mimeElement.GetString() ?? string.Empty
                : string.Empty;

            string? evidenceItemId = intakeStub.TryGetProperty("evidenceItemId", out JsonElement evidenceElement)
                && evidenceElement.ValueKind == JsonValueKind.String
                ? evidenceElement.GetString()
                : null;

            string? pendingMarker = intakeStub.TryGetProperty("pendingStoredFileMarker", out JsonElement pendingElement)
                && pendingElement.ValueKind == JsonValueKind.String
                ? pendingElement.GetString()
                : null;

            metadata = new PixelDiagramIntakeStubMetadata(
                document.Name,
                sourceMimeType,
                evidenceItemId,
                pendingMarker);

            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}

public sealed record PixelDiagramIntakeStubMetadata(
    string FileName,
    string SourceMimeType,
    string? EvidenceItemId,
    string? PendingStoredFileMarker);
