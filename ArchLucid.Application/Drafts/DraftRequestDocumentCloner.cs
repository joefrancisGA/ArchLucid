using System.Text.Json;

using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts;

/// <summary>Deep-clones <see cref="DraftRequestDocument" /> for what-if branching (R12).</summary>
public static class DraftRequestDocumentCloner
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static DraftRequestDocument Clone(DraftRequestDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        string json = JsonSerializer.Serialize(document, JsonOptions);
        DraftRequestDocument? clone = JsonSerializer.Deserialize<DraftRequestDocument>(json, JsonOptions);

        return clone ?? throw new InvalidOperationException("Failed to clone draft document.");
    }
}
