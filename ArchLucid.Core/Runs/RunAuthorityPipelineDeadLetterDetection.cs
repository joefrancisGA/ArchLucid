using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Explanation;
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

            if (!TryReadSupportedSchemaVersion(document.RootElement, out _))
                return null;

            if (!RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(
                    document.RootElement,
                    "failureClass",
                    out JsonElement failureClassElement)
                || failureClassElement.ValueKind != JsonValueKind.String)
            {
                return null;
            }

            string? failureClass = failureClassElement.GetString();

            if (string.IsNullOrWhiteSpace(failureClass))
                return null;

            return new AgentExecutionFailureSummary
            {
                SchemaVersion = SupportedSchemaVersion,
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
        if (!RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, "schemaVersion", out JsonElement element))
        {
            schemaVersion = SupportedSchemaVersion;

            return true;
        }

        if (element.ValueKind == JsonValueKind.Null)
        {
            schemaVersion = SupportedSchemaVersion;

            return true;
        }

        if (element.ValueKind == JsonValueKind.String
            && RunExplanationAggregateJsonReader.TryParseWholeNumberString(element.GetString(), out schemaVersion))
        {
            return schemaVersion == SupportedSchemaVersion;
        }

        if (element.ValueKind == JsonValueKind.String
            && RunExplanationAggregateJsonReader.TryParseBooleanString(element.GetString(), out bool booleanSchema))
        {
            schemaVersion = booleanSchema ? SupportedSchemaVersion : 0;

            return schemaVersion == SupportedSchemaVersion;
        }

        if (element.ValueKind == JsonValueKind.Number
            && RunExplanationAggregateJsonReader.TryReadWholeNumber(element, out schemaVersion))
        {
            return schemaVersion == SupportedSchemaVersion;
        }

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            schemaVersion = element.ValueKind == JsonValueKind.True ? SupportedSchemaVersion : 0;

            return schemaVersion == SupportedSchemaVersion;
        }

        schemaVersion = default;

        return false;
    }
}
