using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings.Factories;

/// <summary>
///     Converts a <see cref="Finding.Payload" /> object to a strongly-typed payload DTO.
/// </summary>
/// <remarks>
///     Payload shapes are handled in priority order:
///     <list type="number">
///         <item>Already the target type — returned directly with no allocation.</item>
///         <item><see cref="string" /> — markdown fences stripped, then parsed as JSON when possible.</item>
///         <item><see cref="JsonElement" /> — string elements are unwrapped; objects deserialize with forgiving options.</item>
///         <item>Any other <see cref="object" /> — round-tripped through JSON.</item>
///     </list>
/// </remarks>
public static class FindingPayloadConverter
{
    /// <summary>
    ///     Shared JSON options used for payload deserialization.
    ///     Case-insensitive matching handles mixed-case keys from LLM engines; trailing commas and
    ///     numeric strings are tolerated because model output is not schema-validated upstream.
    /// </summary>
    private static readonly JsonSerializerOptions ForgivingOptions =
        new(JsonSerializerDefaults.Web)
        {
            PropertyNameCaseInsensitive = true,
            AllowTrailingCommas = true,
            ReadCommentHandling = JsonCommentHandling.Skip,
            NumberHandling = JsonNumberHandling.AllowReadingFromString,
        };

    /// <summary>
    ///     Converts <see cref="Finding.Payload" /> to <typeparamref name="T" />.
    /// </summary>
    /// <typeparam name="T">The target payload type.</typeparam>
    /// <param name="finding">The finding whose payload should be converted.</param>
    /// <returns>
    ///     The converted payload, or <see langword="default" /> when <see cref="Finding.Payload" /> is
    ///     <see langword="null" />.
    /// </returns>
    /// <exception cref="ArgumentNullException">Thrown when <paramref name="finding" /> is <see langword="null" />.</exception>
    /// <exception cref="InvalidOperationException">Thrown when deserialization fails.</exception>
    public static T? ConvertPayload<T>(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.Payload is null)
            return default;

        if (finding.Payload is T typed)
            return typed;

        if (finding.Payload is string stringPayload)
            return DeserializePayloadJson<T>(finding, NormalizeLlmJsonPayload(stringPayload));

        if (finding.Payload is JsonElement jsonElement)
            return DeserializeJsonElementPayload<T>(finding, jsonElement);

        try
        {
            string json = JsonSerializer.Serialize(finding.Payload);
            return DeserializePayloadJson<T>(finding, json);
        }
        catch (JsonException ex)
        {
            throw CreateDeserializationFailure<T>(finding, ex);
        }
    }

    private static T? DeserializeJsonElementPayload<T>(Finding finding, JsonElement jsonElement)
    {
        if (jsonElement.ValueKind == JsonValueKind.String)
        {
            string? embeddedJson = jsonElement.GetString();

            if (!string.IsNullOrWhiteSpace(embeddedJson))
                return DeserializePayloadJson<T>(finding, NormalizeLlmJsonPayload(embeddedJson));
        }

        try
        {
            return jsonElement.Deserialize<T>(ForgivingOptions);
        }
        catch (JsonException ex)
        {
            throw CreateDeserializationFailure<T>(finding, ex);
        }
    }

    private static T? DeserializePayloadJson<T>(Finding finding, string json)
    {
        try
        {
            return JsonSerializer.Deserialize<T>(json, ForgivingOptions);
        }
        catch (JsonException ex)
        {
            throw CreateDeserializationFailure<T>(finding, ex);
        }
    }

    /// <summary>
    ///     LLM engines sometimes wrap JSON objects in markdown code fences; strip those before parsing.
    /// </summary>
    public static string NormalizeLlmJsonPayload(string raw)
    {
        string trimmed = raw.Trim();

        if (!trimmed.StartsWith("```", StringComparison.Ordinal))
            return trimmed;

        int firstNewline = trimmed.IndexOf('\n');

        if (firstNewline < 0)
            return trimmed;

        int contentStart = firstNewline + 1;
        int fenceEnd = trimmed.LastIndexOf("```", StringComparison.Ordinal);

        if (fenceEnd <= contentStart)
            return trimmed;

        return trimmed.Substring(contentStart, fenceEnd - contentStart).Trim();
    }

    private static InvalidOperationException CreateDeserializationFailure<T>(Finding finding, JsonException ex)
    {
        return new InvalidOperationException(
            $"Finding payload cannot be deserialized as {typeof(T).Name} (FindingId={finding.FindingId}).",
            ex);
    }

    /// <summary>Converts the payload to <see cref="RequirementFindingPayload" />.</summary>
    public static RequirementFindingPayload? ToRequirementPayload(Finding finding)
    {
        return ConvertPayload<RequirementFindingPayload>(finding);
    }

    /// <summary>Converts the payload to <see cref="TopologyGapFindingPayload" />.</summary>
    public static TopologyGapFindingPayload? ToTopologyGapPayload(Finding finding)
    {
        return ConvertPayload<TopologyGapFindingPayload>(finding);
    }

    /// <summary>Converts the payload to <see cref="SecurityControlFindingPayload" />.</summary>
    public static SecurityControlFindingPayload? ToSecurityControlPayload(Finding finding)
    {
        return ConvertPayload<SecurityControlFindingPayload>(finding);
    }

    /// <summary>Converts the payload to <see cref="CostConstraintFindingPayload" />.</summary>
    public static CostConstraintFindingPayload? ToCostConstraintPayload(Finding finding)
    {
        return ConvertPayload<CostConstraintFindingPayload>(finding);
    }

    /// <summary>Converts the payload to <see cref="PolicyApplicabilityFindingPayload" />.</summary>
    public static PolicyApplicabilityFindingPayload? ToPolicyApplicabilityPayload(Finding finding)
    {
        return ConvertPayload<PolicyApplicabilityFindingPayload>(finding);
    }

    /// <summary>Converts the payload to <see cref="TopologyCoverageFindingPayload" />.</summary>
    public static TopologyCoverageFindingPayload? ToTopologyCoveragePayload(Finding finding)
    {
        return ConvertPayload<TopologyCoverageFindingPayload>(finding);
    }

    /// <summary>Converts the payload to <see cref="SecurityCoverageFindingPayload" />.</summary>
    public static SecurityCoverageFindingPayload? ToSecurityCoveragePayload(Finding finding)
    {
        return ConvertPayload<SecurityCoverageFindingPayload>(finding);
    }

    /// <summary>Converts the payload to <see cref="PolicyCoverageFindingPayload" />.</summary>
    public static PolicyCoverageFindingPayload? ToPolicyCoveragePayload(Finding finding)
    {
        return ConvertPayload<PolicyCoverageFindingPayload>(finding);
    }

    /// <summary>Converts the payload to <see cref="RequirementCoverageFindingPayload" />.</summary>
    public static RequirementCoverageFindingPayload? ToRequirementCoveragePayload(Finding finding)
    {
        return ConvertPayload<RequirementCoverageFindingPayload>(finding);
    }

    public static RequirementExpectationFindingPayload? ToRequirementExpectationPayload(Finding finding)
    {
        return ConvertPayload<RequirementExpectationFindingPayload>(finding);
    }

    public static SecurityBaselineExpectationFindingPayload? ToSecurityBaselineExpectationPayload(Finding finding)
    {
        return ConvertPayload<SecurityBaselineExpectationFindingPayload>(finding);
    }

    /// <summary>Converts the payload to <see cref="ComplianceFindingPayload" />.</summary>
    public static ComplianceFindingPayload? ToCompliancePayload(Finding finding)
    {
        return ConvertPayload<ComplianceFindingPayload>(finding);
    }
}
