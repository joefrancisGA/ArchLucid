using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Sql;

namespace ArchLucid.Persistence.Findings;

internal static class FindingInspectReadRepositoryCore
{
    public static bool ResolveIncludeTypedPayload(FindingInspectReadOptions? options) =>
        options?.IncludeTypedPayload ?? true;

    public static string NormalizeFindingId(string findingId) => findingId.Trim();

    public static string ResolveMainInspectSql(bool includeTypedPayload) =>
        includeTypedPayload
            ? FindingInspectReadSql.MainInspectWithTypedPayload
            : FindingInspectReadSql.MainInspectWithoutTypedPayload;

    public static DispositionPointerProjection MapDispositionPointerProjection(
        string? dispositionRaw,
        bool hasDispositionRow,
        DateTimeOffset? occurredAtUtc,
        DateTime? revisitDueUtc,
        Guid? eventId,
        string? reviewerUserId,
        byte[]? rowVersionStamp)
    {
        if (!hasDispositionRow)
            return default;

        return new DispositionPointerProjection(
            MapLatestDisposition(dispositionRaw, true),
            occurredAtUtc,
            eventId,
            EncodeRowVersionStampBase64(rowVersionStamp),
            reviewerUserId,
            ToUtcDateTimeOffset(revisitDueUtc));
    }

    public static IReadOnlyList<string> FilterNonBlankTrimmedStrings(IEnumerable<string> values) =>
        values
            .Select(NormalizeInspectText)
            .Where(static value => value is not null)
            .Cast<string>()
            .ToList();

    public static IReadOnlyList<string> FilterRecommendedActions(IEnumerable<string> values) =>
        FilterNonBlankTrimmedStrings(values);

    public static IReadOnlyList<FindingInspectEvidenceItem> BuildEvidenceFromRelatedNodes(IEnumerable<string> relatedNodes) =>
        FilterNonBlankTrimmedStrings(relatedNodes)
            .Select(static node =>
                new FindingInspectEvidenceItem { ArtifactId = null, LineRange = null, Excerpt = node })
            .ToList();

    public static bool HasActiveWaiver(long activeWaiverCount) => activeWaiverCount > 0;

    public static string? EncodeRowVersionStampBase64(byte[]? rowVersionStamp) =>
        rowVersionStamp is null ? null : Convert.ToBase64String(rowVersionStamp);

    public static DateTimeOffset? ToUtcDateTimeOffset(DateTime? value) =>
        value is null ? null : new DateTimeOffset(DateTime.SpecifyKind(value.Value, DateTimeKind.Utc));

    public static FindingDisposition? MapLatestDisposition(string? dispositionRaw, bool hasDispositionRow) =>
        hasDispositionRow ? FindingInspectReadModelMapper.ParseDisposition(dispositionRaw) : null;

    public static string? ResolveDecisionRuleName(string? ruleName, string? ruleId) => ruleName ?? ruleId;

    public static (string? RuleId, string? RuleName) ResolveTraceRuleFields(string? firstRuleText)
    {
        string? normalized = NormalizeInspectText(firstRuleText);

        return normalized is null ? (null, null) : (normalized, normalized);
    }

    public static (string? RuleId, string? RuleName) ResolveRuleFields(string? appliedRuleIdsJson, string? firstRuleText)
    {
        if (string.IsNullOrWhiteSpace(appliedRuleIdsJson))
            return ResolveTraceRuleFields(firstRuleText);

        try
        {
            List<string>? ids = JsonSerializer.Deserialize<List<string>>(appliedRuleIdsJson);

            if (ids is { Count: > 0 })
            {
                string? firstValid = ids
                    .Select(NormalizeInspectText)
                    .FirstOrDefault(normalized => normalized is not null);

                if (firstValid is not null)
                    return (firstValid, firstValid);
            }
        }
        catch (JsonException)
        {
            // Fall through to trace text only.
        }

        return ResolveTraceRuleFields(firstRuleText);
    }

    public static JsonElement? BuildMetadataTypedPayload(string? title, string? rationale)
    {
        string? normalizedTitle = NormalizeInspectText(title);
        string? normalizedRationale = NormalizeInspectText(rationale);

        if (normalizedTitle is null && normalizedRationale is null)
            return null;

        Dictionary<string, string?> slim = new(StringComparer.Ordinal)
        {
            ["title"] = normalizedTitle,
            ["rationale"] = normalizedRationale,
            ["whyThisMatters"] = normalizedRationale,
        };

        return JsonSerializer.SerializeToElement(slim);
    }

    public static string? NormalizeInspectDisplayText(string? value) => NormalizeInspectText(value);

    /// <summary>
    ///     Rejects blank and invisible-only inspect strings (for example U+200B) that pass
    ///     <see cref="string.IsNullOrWhiteSpace(string?)" /> but are not usable operator-facing text.
    /// </summary>
    private static string? NormalizeInspectText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        string trimmed = value.Trim();

        if (!HasSubstantiveInspectText(trimmed))
            return null;

        return trimmed;
    }

    private static bool HasSubstantiveInspectText(string value)
    {
        if (string.IsNullOrEmpty(value))
            return false;

        bool hasSubstantive = false;

        foreach (char character in value)
        {

            if (char.IsWhiteSpace(character))
                continue;

            UnicodeCategory category = char.GetUnicodeCategory(character);

            if (category is UnicodeCategory.Format or UnicodeCategory.Control)
                return false;

            hasSubstantive = true;
        }

        return hasSubstantive;
    }

    public static JsonElement? TryParsePayloadJson(string? payloadJson)
    {
        if (string.IsNullOrWhiteSpace(payloadJson))
            return null;

        try
        {
            return JsonSerializer.Deserialize<JsonElement>(payloadJson);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>
    ///     Resolves typed payload for inspect reads: deserialize relational <c>PayloadJson</c> when valid; when the column
    ///     is non-empty but not valid JSON, fall back to title/rationale metadata so operators can distinguish corrupt rows
    ///     from truly absent payloads.
    /// </summary>
    public static JsonElement? ResolveTypedPayloadForInspect(string? payloadJson, string? title, string? rationale)
    {
        JsonElement? parsed = TryParsePayloadJson(payloadJson);

        if (parsed is not null)
            return parsed;

        if (string.IsNullOrWhiteSpace(payloadJson))
            return null;

        return BuildMetadataTypedPayload(title, rationale);
    }

    public static JsonElement? ResolveTypedPayloadForInspectRead(
        bool includeTypedPayload,
        string? payloadJson,
        string? title,
        string? rationale) =>
        includeTypedPayload
            ? ResolveTypedPayloadForInspect(payloadJson, title, rationale)
            : BuildMetadataTypedPayload(title, rationale);

    public static FindingClassification? ResolveInspectClassification(
        byte? classificationStorage,
        JsonElement? typedPayload)
    {
        FindingClassification? fromStorage = FindingInsightDensityColumnCodec.FromClassificationStorage(classificationStorage);

        if (fromStorage is not null)
        {
            return fromStorage;
        }

        return ResolveClassificationFromTypedPayload(typedPayload);
    }

    public static FindingTreatment? ResolveInspectTreatment(byte? treatmentStorage, JsonElement? typedPayload)
    {
        FindingTreatment? fromStorage = FindingInsightDensityColumnCodec.FromTreatmentStorage(treatmentStorage);

        if (fromStorage is not null)
        {
            return fromStorage;
        }

        return ResolveTreatmentFromTypedPayload(typedPayload);
    }

    private static FindingClassification? ResolveClassificationFromTypedPayload(JsonElement? typedPayload)
    {
        if (typedPayload is null || typedPayload.Value.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        if (!typedPayload.Value.TryGetProperty("classification", out JsonElement classificationElement))
        {
            return null;
        }

        if (classificationElement.ValueKind is JsonValueKind.String)
        {
            string? raw = classificationElement.GetString();

            if (Enum.TryParse(raw, ignoreCase: true, out FindingClassification parsed)
                && Enum.IsDefined(parsed))
            {
                return parsed;
            }
        }

        if (classificationElement.ValueKind is JsonValueKind.Number
            && classificationElement.TryGetInt32(out int numeric)
            && Enum.IsDefined(typeof(FindingClassification), numeric))
        {
            return (FindingClassification)numeric;
        }

        return null;
    }

    private static FindingTreatment? ResolveTreatmentFromTypedPayload(JsonElement? typedPayload)
    {
        if (typedPayload is null || typedPayload.Value.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        if (!typedPayload.Value.TryGetProperty("treatment", out JsonElement treatmentElement))
        {
            return null;
        }

        if (treatmentElement.ValueKind is JsonValueKind.String)
        {
            string? raw = treatmentElement.GetString();

            if (Enum.TryParse(raw, ignoreCase: true, out FindingTreatment parsed)
                && Enum.IsDefined(parsed))
            {
                return parsed;
            }
        }

        if (treatmentElement.ValueKind is JsonValueKind.Number
            && treatmentElement.TryGetInt32(out int numeric)
            && Enum.IsDefined(typeof(FindingTreatment), numeric))
        {
            return (FindingTreatment)numeric;
        }

        return null;
    }

    public static FindingInspectResponse BuildInspectResponse(
        string findingId,
        FindingSeverity severity,
        JsonElement? typedPayload,
        string? ruleId,
        string? ruleName,
        IReadOnlyList<FindingInspectEvidenceItem> evidence,
        IReadOnlyList<string> recommendedActions,
        Guid? auditRowId,
        Guid runId,
        string? manifestVersion,
        string? modelDeploymentName,
        string? modelAlias,
        string? promptTemplateVersion,
        double? confidenceScore,
        int? evaluationConfidenceScore,
        FindingConfidenceLevel? confidenceLevel,
        FindingHumanReviewStatus humanReviewStatus,
        bool isMuted,
        string? muteReason,
        string? reasoningTrace,
        string? reasoningTraceDigestSha256,
        FindingDisposition? latestDisposition,
        DateTimeOffset? latestDispositionOccurredAtUtc,
        bool hasActiveWaiver,
        string? assignedToUserId,
        DateTimeOffset? remediationDueUtc,
        StructuralExecutionMode runStructuralExecutionMode,
        bool runRealModeFellBackToSimulator)
    {
        return new FindingInspectResponse
        {
            FindingId = findingId,
            Severity = severity,
            TypedPayload = typedPayload,
            DecisionRuleId = ruleId,
            DecisionRuleName = ResolveDecisionRuleName(ruleName, ruleId),
            Evidence = evidence,
            RecommendedActions = recommendedActions,
            AuditRowId = auditRowId,
            RunId = runId,
            ManifestVersion = manifestVersion,
            ModelDeploymentName = modelDeploymentName,
            ModelAlias = modelAlias,
            PromptTemplateVersion = promptTemplateVersion,
            ConfidenceScore = confidenceScore,
            EvaluationConfidenceScore = evaluationConfidenceScore,
            ConfidenceLevel = confidenceLevel,
            HumanReviewStatus = humanReviewStatus,
            IsMuted = isMuted,
            MuteReason = muteReason,
            ReasoningTrace = reasoningTrace,
            ReasoningTraceDigestSha256 = reasoningTraceDigestSha256,
            LatestDisposition = latestDisposition,
            LatestDispositionOccurredAtUtc = latestDispositionOccurredAtUtc,
            HasActiveWaiver = hasActiveWaiver,
            AssignedToUserId = assignedToUserId,
            RemediationDueUtc = remediationDueUtc,
            RunStructuralExecutionMode = runStructuralExecutionMode,
            RunRealModeFellBackToSimulator = runRealModeFellBackToSimulator,
        };
    }
}
