using System.Text.Json;

using ArchLucid.Contracts.Governance.Coverage;

namespace ArchLucid.Application.Governance.Coverage;

/// <summary>JSON helpers for <see cref="RunAcknowledgedCoverageDocument" /> on <c>dbo.Runs</c>.</summary>
public static class RunAcknowledgedCoverageJson
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public static string Serialize(RunAcknowledgedCoverageDocument document) =>
        JsonSerializer.Serialize(document, SerializerOptions);

    public static RunAcknowledgedCoverageDocument? TryDeserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        return JsonSerializer.Deserialize<RunAcknowledgedCoverageDocument>(json, SerializerOptions);
    }
}
