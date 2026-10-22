using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Core.Findings.Serialization;

/// <summary>
///     Serializes <see cref="Finding.Payload" /> as a typed JSON object; on read, rehydrates using
///     <see cref="FindingPayloadRegistry" />.
/// </summary>
public sealed partial class FindingJsonConverter : JsonConverter<Finding>
{
    public override Finding Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using JsonDocument doc = JsonDocument.ParseValue(ref reader);
        JsonElement root = doc.RootElement;
        Finding finding = new()
        {
            FindingSchemaVersion =
                TryGetPropertyCaseInsensitive(root, "findingSchemaVersion", out JsonElement fsv) && TryReadInt32(fsv, out int v)
                    ? v
                    : 0,
            FindingId = ReadRequiredString(root, "findingId") is { Length: > 0 } findingId
                ? findingId
                : throw new JsonException("findingId is required."),
            FindingType = ReadRequiredString(root, "findingType"),
            Category = ReadOptionalString(root, "category") ?? "",
            EngineType = ReadRequiredString(root, "engineType"),
            Severity = ReadSeverity(root, "severity"),
            Title = ReadRequiredString(root, "title"),
            Rationale = ReadRequiredString(root, "rationale"),
            RelatedNodeIds = ReadStringList(root, "relatedNodeIds"),
            RecommendedActions = ReadStringList(root, "recommendedActions"),
            Properties = ReadStringDict(root, "properties"),
            PayloadType = ReadOptionalString(root, "payloadType"),
        };

        finding.Trace = ReadTrace(root, options, finding);

        finding.RequestInputRef = ReadOptionalString(root, "requestInputRef");
        finding.RunIdRef = ReadOptionalString(root, "runIdRef");
        finding.AgentExecutionTraceId = ReadOptionalString(root, "agentExecutionTraceId")
                                        ?? finding.Trace.SourceAgentExecutionTraceId;
        finding.ModelDeploymentName = ReadOptionalString(root, "modelDeploymentName");
        finding.ModelVersion = ReadOptionalString(root, "modelVersion");
        finding.PromptTemplateId = ReadOptionalString(root, "promptTemplateId");
        finding.PromptTemplateVersion = ReadOptionalString(root, "promptTemplateVersion");
        finding.PolicyRuleId = ReadOptionalString(root, "policyRuleId");
        finding.ReviewedByUserId = ReadOptionalString(root, "reviewedByUserId");
        finding.ReviewNotes = ReadOptionalString(root, "reviewNotes");

        bool enforcementTierResolved = false;

        if (TryGetPropertyCaseInsensitive(root, "evidencePackageId", out JsonElement packageIdEl))
        {
            if (packageIdEl.ValueKind == JsonValueKind.Null)
            {
                finding.EvidencePackageId = null;
            }
            else if (packageIdEl.ValueKind != JsonValueKind.String)
            {
                throw new JsonException("evidencePackageId must be a string GUID when present.");
            }
            else
            {
                string? packageIdRaw = packageIdEl.GetString();

                if (string.IsNullOrWhiteSpace(packageIdRaw))
                {
                    finding.EvidencePackageId = null;
                }
                else if (!Guid.TryParse(packageIdRaw, out Guid evidencePackageId))
                {
                    throw new JsonException("evidencePackageId must be a valid GUID when present.");
                }
                else
                {
                    finding.EvidencePackageId = evidencePackageId;
                }
            }
        }
        else if (finding.Properties.TryGetValue(FindingPropertyKeys.EvidencePackageId, out string? propertyPackageId))
        {
            if (string.IsNullOrWhiteSpace(propertyPackageId))
            {
                finding.EvidencePackageId = null;
            }
            else if (!Guid.TryParse(propertyPackageId, out Guid propertyEvidencePackageId))
            {
                throw new JsonException("evidencePackageId in properties must be a valid GUID when present.");
            }
            else
            {
                finding.EvidencePackageId = propertyEvidencePackageId;
            }
        }

        if (TryGetPropertyCaseInsensitive(root, "enforcementTier", out JsonElement tierEl))
        {
            finding.EnforcementTier = ReadEnforcementTier(tierEl);
            enforcementTierResolved = true;
        }
        else if (finding.Properties.TryGetValue(FindingPropertyKeys.EnforcementTier, out string? tierFromProps))
        {
            finding.EnforcementTier = ReadEnforcementTierFromString(tierFromProps);
            enforcementTierResolved = true;
        }

        if (!enforcementTierResolved)
            throw new JsonException("enforcementTier is required.");

        finding.Properties[FindingPropertyKeys.EnforcementTier] = finding.EnforcementTier.ToString();

        if (TryGetPropertyCaseInsensitive(root, "confidenceScore", out JsonElement confEl)
            && TryReadFiniteDouble(confEl, out double conf))
            finding.ConfidenceScore = conf;

        if (TryGetPropertyCaseInsensitive(root, "evaluationConfidenceScore", out JsonElement ecsEl)
            && TryReadInt32(ecsEl, out int ecs))
            finding.EvaluationConfidenceScore = ecs;

        if (TryGetPropertyCaseInsensitive(root, "evaluationConfidenceLevel", out JsonElement eclEl))
            finding.ConfidenceLevel = ReadConfidenceLevel(eclEl);

        if (TryGetPropertyCaseInsensitive(root, "humanReviewStatus", out JsonElement hrsEl))
            finding.HumanReviewStatus = ReadHumanReviewStatus(hrsEl);

        if (TryGetPropertyCaseInsensitive(root, "projectedImpactUsd", out JsonElement impactEl)
            && TryReadDecimal(impactEl, out decimal projectedImpactUsd))
            finding.ProjectedImpactUsd = projectedImpactUsd;

        if (TryGetPropertyCaseInsensitive(root, "reviewedAtUtc", out JsonElement raEl)
            && TryReadReviewedAtUtc(raEl, out DateTimeOffset ra))
            finding.ReviewedAtUtc = ra;

        ReadInsightDensityFields(root, finding);

        if (!TryGetPropertyCaseInsensitive(root, "payload", out JsonElement payloadEl) ||
            payloadEl.ValueKind == JsonValueKind.Null)
            return finding;

        string? typeName = finding.PayloadType;
        Type? payloadType = FindingPayloadRegistry.ResolvePayloadType(typeName);
        try
        {
            finding.Payload = payloadType is not null
                ? JsonSerializer.Deserialize(payloadEl.GetRawText(), payloadType, options)
                : payloadEl.Clone();
        }
        catch (JsonException ex)
        {
            throw new JsonException(
                $"Failed to deserialize payload of type '{typeName}' for finding '{finding.FindingId}'.", ex);
        }

        return finding;
    }

    public override void Write(Utf8JsonWriter writer, Finding value, JsonSerializerOptions options)
    {
        if (value.Properties.TryGetValue(FindingPropertyKeys.EvidencePackageId, out string? propertyPackageId)
            && !string.IsNullOrWhiteSpace(propertyPackageId)
            && !Guid.TryParse(propertyPackageId, out _))
        {
            throw new JsonException("evidencePackageId in properties must be a valid GUID when present.");
        }

        writer.WriteStartObject();
        writer.WriteNumber("findingSchemaVersion", value.FindingSchemaVersion);
        writer.WriteString("findingId", value.FindingId);
        writer.WriteString("findingType", value.FindingType);
        writer.WriteString("category", value.Category);
        writer.WriteString("engineType", value.EngineType);
        writer.WriteString("severity", value.Severity.ToString());
        writer.WriteString("title", value.Title);
        writer.WriteString("rationale", value.Rationale);
        writer.WritePropertyName("relatedNodeIds");
        JsonSerializer.Serialize(writer, value.RelatedNodeIds, options);
        writer.WritePropertyName("recommendedActions");
        JsonSerializer.Serialize(writer, value.RecommendedActions, options);

        Dictionary<string, string> properties = new(value.Properties);

        if (value.EvidencePackageId is Guid syncedPackageId)
        {
            properties[FindingPropertyKeys.EvidencePackageId] = syncedPackageId.ToString("D");
            value.Properties[FindingPropertyKeys.EvidencePackageId] = syncedPackageId.ToString("D");
        }
        else
        {
            properties.Remove(FindingPropertyKeys.EvidencePackageId);
            value.Properties.Remove(FindingPropertyKeys.EvidencePackageId);
        }

        properties[FindingPropertyKeys.EnforcementTier] = value.EnforcementTier.ToString();
        value.Properties[FindingPropertyKeys.EnforcementTier] = value.EnforcementTier.ToString();

        writer.WritePropertyName("properties");
        JsonSerializer.Serialize(writer, properties, options);

        if (value.PayloadType is not null)
            writer.WriteString("payloadType", value.PayloadType);
        else
            writer.WriteNull("payloadType");
        writer.WritePropertyName("payload");

        if (value.Payload is null)
            writer.WriteNullValue();
        else
            JsonSerializer.Serialize(writer, value.Payload, value.Payload.GetType(), options);
        writer.WritePropertyName("trace");
        JsonSerializer.Serialize(writer, value.Trace, options);
        WriteOptionalString(writer, "requestInputRef", value.RequestInputRef);
        WriteOptionalString(writer, "runIdRef", value.RunIdRef);
        WriteOptionalString(writer, "agentExecutionTraceId", value.AgentExecutionTraceId);
        WriteOptionalString(writer, "modelDeploymentName", value.ModelDeploymentName);
        WriteOptionalString(writer, "modelVersion", value.ModelVersion);
        WriteOptionalString(writer, "promptTemplateId", value.PromptTemplateId);
        WriteOptionalString(writer, "promptTemplateVersion", value.PromptTemplateVersion);
        WriteOptionalString(writer, "policyRuleId", value.PolicyRuleId);
        writer.WriteString("enforcementTier", value.EnforcementTier.ToString());

        if (value.ConfidenceScore is { } score)
            writer.WriteNumber("confidenceScore", score);
        else
            writer.WriteNull("confidenceScore");

        if (value.EvaluationConfidenceScore is { } ecs)
            writer.WriteNumber("evaluationConfidenceScore", ecs);
        else
            writer.WriteNull("evaluationConfidenceScore");

        if (value.ConfidenceLevel is { } ecl)
            writer.WriteString("evaluationConfidenceLevel", ecl.ToString());
        else
            writer.WriteNull("evaluationConfidenceLevel");

        writer.WriteString("humanReviewStatus", value.HumanReviewStatus.ToString());

        if (value.ProjectedImpactUsd is { } projectedImpactUsd)
            writer.WriteNumber("projectedImpactUsd", projectedImpactUsd);

        WriteOptionalString(writer, "reviewedByUserId", value.ReviewedByUserId);

        if (value.ReviewedAtUtc is { } ra)
            writer.WriteString("reviewedAtUtc", ra.ToString("O", CultureInfo.InvariantCulture));
        else
            writer.WriteNull("reviewedAtUtc");

        WriteOptionalString(writer, "reviewNotes", value.ReviewNotes);

        if (value.EvidencePackageId is Guid packageId)
            writer.WriteString("evidencePackageId", packageId.ToString("D"));
        else
            writer.WriteNull("evidencePackageId");

        WriteInsightDensityFields(writer, value);
        writer.WriteEndObject();
    }
}
