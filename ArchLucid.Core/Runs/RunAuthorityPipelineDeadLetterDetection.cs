using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Json;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Core.Runs;

/// <summary>
///     Derives operator-facing dead-letter state from persisted <c>dbo.Runs.LastFailureReason</c> JSON.
/// </summary>
public static class RunAuthorityPipelineDeadLetterDetection
{
    private const int SupportedSchemaVersion = 1;

    /// <summary>
    ///     <see langword="true" /> when <paramref name="record" /> carries a pipeline dead-letter failure summary.
    /// </summary>
    public static bool IsDeadLettered(RunRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        return IsDeadLettered(record.LastFailureReason);
    }

    /// <summary>
    ///     <see langword="true" /> when <paramref name="lastFailureReason" /> JSON uses
    ///     <see cref="AgentExecutionFailureClasses.PipelineDeadLetter" />.
    /// </summary>
    public static bool IsDeadLettered(string? lastFailureReason)
    {
        AgentExecutionFailureSummary? summary = TryDeserialize(lastFailureReason);

        if (summary is null)
            return false;

        return string.Equals(
            summary.FailureClass,
            AgentExecutionFailureClasses.PipelineDeadLetter,
            StringComparison.OrdinalIgnoreCase);
    }

    private static AgentExecutionFailureSummary? TryDeserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        string trimmed = json.TrimStart();

        if (!trimmed.StartsWith("{", StringComparison.Ordinal))
            return null;

        try
        {
            using JsonDocument document = JsonDocument.Parse(json);

            if (!TryReadSupportedSchemaVersion(document.RootElement, out int schemaVersion))
                return null;

            if (!RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitivePreferLastNonEmpty(
                    document.RootElement,
                    "failureClass",
                    out JsonElement failureClassElement)
                || !RunExplanationAggregateJsonReader.TryReadNonEmptyTextToken(failureClassElement, out string? failureClass))
            {
                return null;
            }

            failureClass = failureClass?.Trim();

            if (string.IsNullOrWhiteSpace(failureClass))
                return null;

            return new AgentExecutionFailureSummary
            {
                SchemaVersion = schemaVersion,
                FailureClass = failureClass,
            };
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static bool TryReadSupportedSchemaVersion(JsonElement root, out int schemaVersion)
    {
        // Scan every case-variant alias: a trailing below-minimum or unreadable schemaVersion must not hide an
        // earlier supported value (parity with failureClass PreferLastNonEmpty). PreferLastNonEmpty itself is not
        // used here because a sole schemaVersion:true would be treated as empty and default to v1.

        bool foundAlias = false;
        int? lastSupportedVersion = null;

        foreach (JsonProperty property in root.EnumerateObject())
        {

            if (!string.Equals(property.Name, "schemaVersion", StringComparison.OrdinalIgnoreCase))
                continue;

            foundAlias = true;

            if (property.Value.ValueKind == JsonValueKind.Null)
            {
                lastSupportedVersion = SupportedSchemaVersion;

                continue;
            }

            if (!StrictSchemaVersionReader.TryReadSchemaVersion(property.Value, out int parsedVersion))
                continue;

            if (parsedVersion >= SupportedSchemaVersion)
                lastSupportedVersion = parsedVersion;
        }

        if (!foundAlias)
        {
            schemaVersion = SupportedSchemaVersion;

            return true;
        }

        if (lastSupportedVersion is not int supported)
        {
            schemaVersion = default;

            return false;
        }

        schemaVersion = supported;

        return true;
    }
}
