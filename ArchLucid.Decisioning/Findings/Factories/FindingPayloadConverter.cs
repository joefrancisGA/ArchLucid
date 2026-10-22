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
public static partial class FindingPayloadConverter
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

    /// <summary>Converts the payload to <see cref="PolicyCoverageFindingPayload" />.</summary>
    public static PolicyCoverageFindingPayload? ToPolicyCoveragePayload(Finding finding)
    {
        return ConvertPayload<PolicyCoverageFindingPayload>(finding);
    }

    /// <summary>Converts the payload to <see cref="ComplianceFindingPayload" />.</summary>
    public static ComplianceFindingPayload? ToCompliancePayload(Finding finding)
    {
        return ConvertPayload<ComplianceFindingPayload>(finding);
    }
}
