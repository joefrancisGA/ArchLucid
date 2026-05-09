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
///     require minified output — use <see cref="CamelCaseIgnoreNullCompact" /> instead.
/// </remarks>
public static class ContractJson
{
    /// <summary>
    ///     camelCase, compact; default ignore behavior — null properties are written when present (audit payloads).
    /// </summary>
    public static readonly JsonSerializerOptions CamelCaseCompact = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    /// <summary>
    ///     camelCase, omit null properties when writing, compact (typical outbound HTTP JSON).
    /// </summary>
    public static readonly JsonSerializerOptions CamelCaseIgnoreNullCompact = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    /// <summary>
    ///     camelCase, indented; default ignore behavior — null properties are written when present (human-readable CLI dumps).
    /// </summary>
    public static readonly JsonSerializerOptions CamelCaseIncludeNullIndented = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
    };

    /// <summary>
    ///     camelCase, omit null properties when writing, indented (CLI snapshots and human-readable exports).
    /// </summary>
    public static readonly JsonSerializerOptions CamelCaseIgnoreNullIndented = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    /// <summary>
    ///     Like <see cref="CamelCaseIgnoreNullCompact"/> with case-insensitive property names on deserialize (HTTP smoke harness).
    /// </summary>
    public static readonly JsonSerializerOptions CamelCaseIgnoreNullCompactCaseInsensitive = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = false,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    /// <summary>
    ///     camelCase, compact; writes null JSON properties (golden-manifest blob envelope parity).
    /// </summary>
    public static readonly JsonSerializerOptions CamelCaseIncludeNullCompact = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
        DefaultIgnoreCondition = JsonIgnoreCondition.Never,
    };

    /// <summary>
    ///     Deserialize helper: camelCase with case-insensitive property names (admin/API JSON snapshots).
    /// </summary>
    public static readonly JsonSerializerOptions CamelCaseDeserializeCaseInsensitive = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    /// <summary>
    ///     The canonical JSON serialization options for ArchLucid contract types:
    ///     camelCase names, indented output, and <see langword="null" /> properties omitted.
    /// </summary>
    public static readonly JsonSerializerOptions Default = new(CamelCaseIgnoreNullIndented)
    {
        Converters =
        {
            // Severity is part of canonical LLM / API corpus shape (strings). Default enum JSON is ordinal numbers,
            // which fails RealLlmOutputStructuralValidator; still accept integer payloads on read for older stored rows.
            new JsonStringEnumConverter<FindingSeverity>(allowIntegerValues: true),
        },
    };
}
