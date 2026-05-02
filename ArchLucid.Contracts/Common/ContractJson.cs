using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.Common;

/// <summary>
///     Shared <see cref="JsonSerializerOptions" /> presets used across the ArchLucid contract surface.
///     Use <see cref="Default" /> wherever contract DTOs are serialized for storage, export, or display.
/// </summary>
/// <remarks>
///     <see cref="Default" /> uses camelCase property names, human-readable indented output, and omits
///     <see langword="null" /> properties to keep stored JSON compact. Do not use it for hot paths that
///     require minified output — create a separate options instance for those.
/// </remarks>
public static class ContractJson
{
    /// <summary>
    ///     The canonical JSON serialization options for ArchLucid contract types:
    ///     camelCase names, indented output, and <see langword="null" /> properties omitted.
    /// </summary>
    public static readonly JsonSerializerOptions Default = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters =
        {
            // Severity is part of canonical LLM / API corpus shape (strings). Default enum JSON is ordinal numbers,
            // which fails RealLlmOutputStructuralValidator; still accept integer payloads on read for older stored rows.
            new JsonStringEnumConverter<FindingSeverity>(allowIntegerValues: true),
        },
    };
}
