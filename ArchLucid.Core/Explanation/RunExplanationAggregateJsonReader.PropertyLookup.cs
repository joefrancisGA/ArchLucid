using System.Text.Json;

using ArchLucid.Core.Json;

namespace ArchLucid.Core.Explanation;

internal static partial class RunExplanationAggregateJsonReader
{
    public static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
    {
        value = default;
        bool found = false;

        foreach (JsonProperty property in element.EnumerateObject())

            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                // Duplicate JSON properties are accepted by JsonDocument; use the last matching value like common JSON
                // deserializers so an empty first alias cannot hide a later usable model response.
                value = property.Value;
                found = true;
            }

        if (found)
            return true;

        return false;
    }

    /// <summary>
    ///     When duplicate case-variant properties appear, retain the last token that is not an empty string or empty array
    ///     so a trailing empty alias cannot discard an earlier usable model value.
    /// </summary>
    public static bool TryGetPropertyCaseInsensitivePreferLastNonEmpty(
        JsonElement element,
        string propertyName,
        out JsonElement value)
    {
        value = default;
        JsonElement? lastMatch = null;
        JsonElement? lastNonEmpty = null;
        int caseInsensitiveAliasMatchCount = 0;
        bool sawNonEmptyCaseInsensitiveAlias = false;

        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            caseInsensitiveAliasMatchCount++;
            lastMatch = property.Value;

            if (IsNonEmptyJsonPropertyValue(property.Value, propertyName, sawNonEmptyCaseInsensitiveAlias))
            {
                lastNonEmpty = property.Value;
                sawNonEmptyCaseInsensitiveAlias = true;
            }
        }

        if (lastNonEmpty is JsonElement nonEmpty)
        {
            value = nonEmpty;

            return true;
        }

        if (lastMatch is JsonElement confidenceLast
            && (propertyName.Equals("confidence", StringComparison.OrdinalIgnoreCase)
                || propertyName.Equals("faithfulnessSupportRatio", StringComparison.OrdinalIgnoreCase))
            && (TryReadFiniteDouble(confidenceLast) is not null
                || (confidenceLast.ValueKind == JsonValueKind.Array
                    && !ArrayPropertyValueIsNonEmpty(confidenceLast, propertyName)
                    && (ArrayContainsOnlyZeroNumericElements(confidenceLast)
                        || ConfidenceRatioArrayHasReadableScalarEntry(confidenceLast)))))
        {
            value = confidenceLast;

            return true;
        }

        if (lastMatch is JsonElement reasoningLast
            && propertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase)
            && (TryReadFiniteDouble(reasoningLast) is not null
                || (reasoningLast.ValueKind == JsonValueKind.Array
                    && !ArrayPropertyValueIsNonEmpty(reasoningLast, propertyName)
                    && (ArrayContainsOnlyZeroNumericElements(reasoningLast)
                        || ReasoningArrayHasReadableScalarEntry(reasoningLast)))))
        {
            value = reasoningLast;

            return true;
        }

        if (lastMatch is JsonElement stringListLast
            && IsStructuredStringListPropertyName(propertyName)
            && stringListLast.ValueKind == JsonValueKind.Array
            && !ArrayPropertyValueIsNonEmpty(stringListLast, propertyName)
            && ArrayContainsOnlyZeroNumericElements(stringListLast))
        {
            value = stringListLast;

            return true;
        }

        if (lastMatch is JsonElement stringListScalarLast
            && IsStructuredStringListPropertyName(propertyName)
            && stringListScalarLast.ValueKind != JsonValueKind.Array
            && IsZeroConfidenceAliasValue(stringListScalarLast))
        {
            value = stringListScalarLast;

            return true;
        }

        if (lastMatch is JsonElement countLast
            && IsAggregateWholeNumberCountPropertyName(propertyName)
            && IsZeroConfidenceAliasValue(countLast))
        {
            value = countLast;

            return true;
        }

        if (caseInsensitiveAliasMatchCount == 1
            && lastMatch is JsonElement soleCount
            && IsAggregateWholeNumberCountPropertyName(propertyName)
            && TryReadWholeNumber(soleCount, out _))
        {
            value = soleCount;

            return true;
        }

        if (caseInsensitiveAliasMatchCount == 1
            && lastMatch is JsonElement warningLast
            && propertyName.Equals("faithfulnessWarning", StringComparison.OrdinalIgnoreCase)
            && (warningLast.ValueKind == JsonValueKind.True || IsBooleanOneAliasValue(warningLast)))
        {
            value = warningLast;

            return true;
        }

        if (caseInsensitiveAliasMatchCount == 1
            && lastMatch is JsonElement soleWarningNumeric
            && propertyName.Equals("faithfulnessWarning", StringComparison.OrdinalIgnoreCase)
            && soleWarningNumeric.ValueKind == JsonValueKind.Number
            && TryReadNonEmptyTextToken(soleWarningNumeric, out _))
        {
            value = soleWarningNumeric;

            return true;
        }

        if (caseInsensitiveAliasMatchCount == 1
            && lastMatch is JsonElement soleRiskPostureNumeric
            && propertyName.Equals("riskPosture", StringComparison.OrdinalIgnoreCase)
            && soleRiskPostureNumeric.ValueKind == JsonValueKind.Number
            && TryReadNonEmptyTextToken(soleRiskPostureNumeric, out _))
        {
            value = soleRiskPostureNumeric;

            return true;
        }

        if (caseInsensitiveAliasMatchCount == 1
            && lastMatch is JsonElement soleCalloutString
            && (propertyName.Equals("faithfulnessWarning", StringComparison.OrdinalIgnoreCase)
                || propertyName.Equals("riskPosture", StringComparison.OrdinalIgnoreCase))
            && soleCalloutString.ValueKind == JsonValueKind.String
            && TryReadNonEmptyTextToken(soleCalloutString, out _))
        {
            value = soleCalloutString;

            return true;
        }

        if (caseInsensitiveAliasMatchCount == 1
            && lastMatch is JsonElement citationsLast
            && propertyName.Equals("citations", StringComparison.OrdinalIgnoreCase)
            && citationsLast.ValueKind == JsonValueKind.True)
        {
            value = citationsLast;

            return true;
        }

        if (caseInsensitiveAliasMatchCount == 1
            && lastMatch is JsonElement soleCalloutStringArray
            && IsAggregateStringCalloutPropertyName(propertyName)
            && soleCalloutStringArray.ValueKind == JsonValueKind.Array
            && AggregateCalloutStringArrayHasReadableScalarEntry(soleCalloutStringArray))
        {
            value = soleCalloutStringArray;

            return true;
        }

        if (caseInsensitiveAliasMatchCount == 1
            && lastMatch is JsonElement soleWholeNumberCountArray
            && IsAggregateWholeNumberCountPropertyName(propertyName)
            && soleWholeNumberCountArray.ValueKind == JsonValueKind.Array
            && AggregateWholeNumberCountArrayHasReadableNumericEntry(soleWholeNumberCountArray))
        {
            value = soleWholeNumberCountArray;

            return true;
        }

        if (caseInsensitiveAliasMatchCount == 1
            && lastMatch is JsonElement soleStringListArray
            && IsStructuredStringListPropertyName(propertyName)
            && soleStringListArray.ValueKind == JsonValueKind.Array
            && StructuredStringListArrayHasReadableScalarEntry(soleStringListArray))
        {
            value = soleStringListArray;

            return true;
        }

        if (caseInsensitiveAliasMatchCount == 1
            && lastMatch is JsonElement soleSchemaVersion
            && propertyName.Equals("schemaVersion", StringComparison.OrdinalIgnoreCase)
            && (StrictSchemaVersionReader.TryReadSchemaVersion(soleSchemaVersion, out _)
                || (soleSchemaVersion.ValueKind == JsonValueKind.Array
                    && !ArrayPropertyValueIsNonEmpty(soleSchemaVersion, propertyName)
                    && SchemaVersionArrayHasReadableScalarEntry(soleSchemaVersion))))
        {
            value = soleSchemaVersion;

            return true;
        }

        if (caseInsensitiveAliasMatchCount == 1
            && lastMatch is JsonElement soleStringListScalar
            && IsStructuredStringListPropertyName(propertyName)
            && (IsBooleanOneAliasValue(soleStringListScalar)
                || soleStringListScalar.ValueKind == JsonValueKind.String
                || soleStringListScalar.ValueKind == JsonValueKind.Object
                || soleStringListScalar.ValueKind == JsonValueKind.Array
                || (soleStringListScalar.ValueKind == JsonValueKind.Number
                    && TryReadNonEmptyTextToken(soleStringListScalar, out _))))
        {
            value = soleStringListScalar;

            return true;
        }

        if (caseInsensitiveAliasMatchCount == 1
            && lastMatch is JsonElement soleDeterministicFallbackArray
            && IsDeterministicFallbackPropertyName(propertyName)
            && soleDeterministicFallbackArray.ValueKind == JsonValueKind.Array
            && TryReadAggregateBooleanToken(soleDeterministicFallbackArray, out _))
        {
            value = soleDeterministicFallbackArray;

            return true;
        }

        return false;
    }

    private static bool IsAggregateWholeNumberCountPropertyName(string propertyName) =>
        propertyName.Equals("citations", StringComparison.OrdinalIgnoreCase)
        || propertyName.Equals("decisionCount", StringComparison.OrdinalIgnoreCase)
        || propertyName.Equals("unresolvedIssueCount", StringComparison.OrdinalIgnoreCase)
        || propertyName.Equals("complianceGapCount", StringComparison.OrdinalIgnoreCase);

    private static bool IsDeterministicFallbackPropertyName(string propertyName) =>
        propertyName.Equals("deterministicFallbackUsed", StringComparison.OrdinalIgnoreCase)
        || propertyName.Equals("usedDeterministicFallback", StringComparison.OrdinalIgnoreCase);

    private static bool IsStructuredStringListPropertyName(string propertyName) =>
        propertyName.Equals("evidenceRefs", StringComparison.OrdinalIgnoreCase)
        || propertyName.Equals("alternativesConsidered", StringComparison.OrdinalIgnoreCase)
        || propertyName.Equals("caveats", StringComparison.OrdinalIgnoreCase);

    private static bool IsNonEmptyJsonPropertyValue(
        JsonElement jsonElement,
        string structuredPropertyName,
        bool applyTrailingDuplicateArrayPoison = false)
    {
        if ((structuredPropertyName.Equals("confidence", StringComparison.OrdinalIgnoreCase)
             || structuredPropertyName.Equals("faithfulnessSupportRatio", StringComparison.OrdinalIgnoreCase))
            && (IsZeroConfidenceAliasValue(jsonElement) || IsBooleanOneAliasValue(jsonElement)))
        {
            return false;
        }

        if (IsAggregateWholeNumberCountPropertyName(structuredPropertyName)
            && (IsZeroConfidenceAliasValue(jsonElement) || IsBooleanOneAliasValue(jsonElement)))
        {
            return false;
        }

        if (IsAggregateWholeNumberCountPropertyName(structuredPropertyName)
            && jsonElement.ValueKind == JsonValueKind.Number
            && TryReadWholeNumber(jsonElement, out int wholeCountAlias)
            && wholeCountAlias > 10)
        {
            return false;
        }

        if (IsAggregateWholeNumberCountPropertyName(structuredPropertyName)
            && jsonElement.ValueKind == JsonValueKind.String
            && TryReadWholeNumber(jsonElement, out int wholeCountStringAlias)
            && wholeCountStringAlias > 10)
        {
            return false;
        }

        if ((structuredPropertyName.Equals("faithfulnessWarning", StringComparison.OrdinalIgnoreCase)
             || structuredPropertyName.Equals("riskPosture", StringComparison.OrdinalIgnoreCase))
            && (IsZeroConfidenceAliasValue(jsonElement) || IsBooleanOneAliasValue(jsonElement)))
        {
            return false;
        }

        if ((structuredPropertyName.Equals("faithfulnessWarning", StringComparison.OrdinalIgnoreCase)
             || structuredPropertyName.Equals("riskPosture", StringComparison.OrdinalIgnoreCase))
            && jsonElement.ValueKind == JsonValueKind.Number)
        {
            return false;
        }

        if ((structuredPropertyName.Equals("faithfulnessWarning", StringComparison.OrdinalIgnoreCase)
             || structuredPropertyName.Equals("riskPosture", StringComparison.OrdinalIgnoreCase))
            && jsonElement.ValueKind == JsonValueKind.String
            && TryReadWholeNumber(jsonElement, out int calloutStringAlias)
            && calloutStringAlias > 10)
        {
            return false;
        }

        if ((structuredPropertyName.Equals("schemaVersion", StringComparison.OrdinalIgnoreCase)
             || structuredPropertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase))
            && (IsZeroConfidenceAliasValue(jsonElement) || IsBooleanOneAliasValue(jsonElement)))
        {
            return false;
        }

        if (structuredPropertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase)
            && jsonElement.ValueKind == JsonValueKind.Number)
        {
            return false;
        }

        if (structuredPropertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase)
            && jsonElement.ValueKind == JsonValueKind.String
            && TryReadWholeNumber(jsonElement, out int reasoningStringAlias)
            && reasoningStringAlias > 10)
        {
            return false;
        }

        if ((structuredPropertyName.Equals("confidence", StringComparison.OrdinalIgnoreCase)
             || structuredPropertyName.Equals("faithfulnessSupportRatio", StringComparison.OrdinalIgnoreCase))
            && jsonElement.ValueKind == JsonValueKind.Number
            && TryReadFiniteDouble(jsonElement) is > 1)
        {
            return false;
        }

        if ((structuredPropertyName.Equals("confidence", StringComparison.OrdinalIgnoreCase)
             || structuredPropertyName.Equals("faithfulnessSupportRatio", StringComparison.OrdinalIgnoreCase))
            && jsonElement.ValueKind == JsonValueKind.String
            && TryReadFiniteDouble(jsonElement) is > 1)
        {
            return false;
        }

        if (structuredPropertyName.Equals("schemaVersion", StringComparison.OrdinalIgnoreCase)
            && StrictSchemaVersionReader.TryReadSchemaVersion(jsonElement, out int schemaAliasVersion)
            && schemaAliasVersion > StructuredExplanationParser.MaxSupportedStructuredExplanationSchemaVersion)
        {
            return false;
        }

        if (IsStructuredStringListPropertyName(structuredPropertyName)
            && (IsZeroConfidenceAliasValue(jsonElement) || IsBooleanOneAliasValue(jsonElement)))
        {
            return false;
        }

        if (IsStructuredStringListPropertyName(structuredPropertyName)
            && jsonElement.ValueKind == JsonValueKind.Number)
        {
            return false;
        }

        if (IsStructuredStringListPropertyName(structuredPropertyName)
            && jsonElement.ValueKind == JsonValueKind.String
            && TryReadWholeNumber(jsonElement, out int wholeStringListAlias)
            && wholeStringListAlias > 10)
        {
            return false;
        }

        if (IsDeterministicFallbackPropertyName(structuredPropertyName)
            && jsonElement.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            if (applyTrailingDuplicateArrayPoison)
                return false;

            return true;
        }

        if (IsDeterministicFallbackPropertyName(structuredPropertyName)
            && IsBooleanOneAliasValue(jsonElement))
        {
            if (applyTrailingDuplicateArrayPoison)
                return false;

            return true;
        }

        if (IsDeterministicFallbackPropertyName(structuredPropertyName)
            && jsonElement.ValueKind == JsonValueKind.String
            && TryParseWholeNumberString(jsonElement.GetString()?.Trim(), out int deterministicFallbackStringAlias)
            && deterministicFallbackStringAlias == 1)
        {
            if (applyTrailingDuplicateArrayPoison)
                return false;

            return true;
        }

        if (IsDeterministicFallbackPropertyName(structuredPropertyName)
            && jsonElement.ValueKind == JsonValueKind.String
            && TryParseBooleanString(jsonElement.GetString()?.Trim(), out _))
        {
            if (applyTrailingDuplicateArrayPoison)
                return false;

            return true;
        }

        if (IsDeterministicFallbackPropertyName(structuredPropertyName)
            && IsZeroConfidenceAliasValue(jsonElement))
        {
            if (applyTrailingDuplicateArrayPoison)
                return false;

            return true;
        }

        if (applyTrailingDuplicateArrayPoison
            && IsRatioPropertyName(structuredPropertyName)
            && RatioDuplicateScalarAliasIsPoison(jsonElement))
        {
            return false;
        }

        if (applyTrailingDuplicateArrayPoison
            && IsAggregateWholeNumberCountPropertyName(structuredPropertyName)
            && WholeNumberCountTrailingDuplicateAliasIsPoison(jsonElement))
        {
            return false;
        }

        if (applyTrailingDuplicateArrayPoison
            && IsAggregateStringCalloutPropertyName(structuredPropertyName)
            && CalloutTrailingDuplicateScalarAliasIsPoison(jsonElement))
        {
            return false;
        }

        if (applyTrailingDuplicateArrayPoison
            && structuredPropertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase)
            && ReasoningArrayItemIsDuplicateAliasPoison(jsonElement, applyTrailingDuplicateArrayPoison: true))
        {
            return false;
        }

        if (applyTrailingDuplicateArrayPoison
            && structuredPropertyName.Equals("schemaVersion", StringComparison.OrdinalIgnoreCase)
            && SchemaVersionTrailingDuplicateScalarAliasIsPoison(jsonElement))
        {
            return false;
        }

        if (applyTrailingDuplicateArrayPoison
            && IsStructuredStringListPropertyName(structuredPropertyName)
            && StructuredStringListTrailingDuplicateScalarAliasIsPoison(jsonElement))
        {
            return false;
        }

        return jsonElement.ValueKind switch
        {
            JsonValueKind.Null => false,
            JsonValueKind.True or JsonValueKind.False => false,
            JsonValueKind.String => !string.IsNullOrWhiteSpace(jsonElement.GetString()),
            JsonValueKind.Array => ArrayPropertyValueIsNonEmpty(jsonElement, structuredPropertyName, applyTrailingDuplicateArrayPoison),
            JsonValueKind.Object => ObjectPropertyValueIsNonEmpty(
                jsonElement,
                structuredPropertyName,
                applyTrailingDuplicateArrayPoison),
            _ => true,
        };
    }

    private static bool IsZeroConfidenceAliasValue(JsonElement jsonElement)
    {
        double? finite = TryReadFiniteDouble(jsonElement);

        return finite is 0;
    }

    private static bool IsBooleanOneAliasValue(JsonElement jsonElement)
    {
        if (jsonElement.ValueKind == JsonValueKind.True)
            return true;

        if (jsonElement.ValueKind != JsonValueKind.Number)
            return false;

        double? finite = TryReadFiniteDouble(jsonElement);

        return finite is 1;
    }

    private static bool ArrayPropertyValueIsNonEmpty(
        JsonElement jsonElement,
        string structuredPropertyName,
        bool applyTrailingDuplicateArrayPoison = false)
    {
        foreach (JsonElement item in jsonElement.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Null)
                continue;

            if (item.ValueKind == JsonValueKind.String && string.IsNullOrWhiteSpace(item.GetString()))
                continue;

            if (item.ValueKind is JsonValueKind.True or JsonValueKind.False)
                continue;

            if (IsDeterministicFallbackPropertyName(structuredPropertyName)
                && applyTrailingDuplicateArrayPoison
                && (IsBooleanOneAliasValue(item)
                    || IsZeroConfidenceAliasValue(item)
                    || (item.ValueKind == JsonValueKind.String
                        && TryParseWholeNumberString(item.GetString()?.Trim(), out int deterministicFallbackArrayStringAlias)
                        && (deterministicFallbackArrayStringAlias == 0 || deterministicFallbackArrayStringAlias == 1))
                    || (item.ValueKind == JsonValueKind.String
                        && TryParseBooleanString(item.GetString()?.Trim(), out _))))
            {
                continue;
            }

            if ((IsStructuredStringListPropertyName(structuredPropertyName)
                 || structuredPropertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase)
                 || structuredPropertyName.Equals("confidence", StringComparison.OrdinalIgnoreCase))
                && item.ValueKind == JsonValueKind.Number
                && TryReadFiniteDouble(item) is 0)
            {
                continue;
            }

            if (item.ValueKind == JsonValueKind.Array)
            {
                if (ArrayPropertyValueIsNonEmpty(item, structuredPropertyName, applyTrailingDuplicateArrayPoison))
                    return true;

                continue;
            }

            if (item.ValueKind == JsonValueKind.Object)
            {
                if (structuredPropertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase))
                {
                    if (ReasoningArrayEntryObjectHasExtractableContent(item))
                    {
                        if (!applyTrailingDuplicateArrayPoison)
                            return true;

                        continue;
                    }
                }
                else if (IsStructuredStringListPropertyName(structuredPropertyName))
                {
                    if (ProseListObjectAliasHasExtractableContent(item))
                    {
                        if (!applyTrailingDuplicateArrayPoison)
                            return true;

                        continue;
                    }
                }
                else if (structuredPropertyName.Equals("citations", StringComparison.OrdinalIgnoreCase))
                {
                    if (CitationArrayItemIsDuplicateAliasPoison(item, applyTrailingDuplicateArrayPoison))
                        continue;

                    if (!string.IsNullOrWhiteSpace(TryReadEvidenceRefObjectStringProperty(item)))
                        return true;
                }
                else if (ObjectPropertyValueIsNonEmpty(
                             item,
                             structuredPropertyName,
                             applyTrailingDuplicateArrayPoison))
                {
                    return true;
                }

                continue;
            }

            if (IsAggregateWholeNumberCountPropertyName(structuredPropertyName)
                && TryReadWholeNumber(item, out _))
            {
                continue;
            }

            if (IsAggregateWholeNumberCountPropertyName(structuredPropertyName)
                && applyTrailingDuplicateArrayPoison
                && WholeNumberCountTrailingDuplicateAliasIsPoison(item))
            {
                continue;
            }

            if (structuredPropertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase)
                && ReasoningArrayItemIsDuplicateAliasPoison(item, applyTrailingDuplicateArrayPoison))
            {
                continue;
            }

            if (structuredPropertyName.Equals("citations", StringComparison.OrdinalIgnoreCase)
                && CitationArrayItemIsDuplicateAliasPoison(item, applyTrailingDuplicateArrayPoison))
            {
                continue;
            }

            if (IsRatioPropertyName(structuredPropertyName)
                && TryReadFiniteDouble(item) is not null)
            {
                continue;
            }

            if (structuredPropertyName.Equals("schemaVersion", StringComparison.OrdinalIgnoreCase)
                && IsBooleanOneAliasValue(item))
            {
                continue;
            }

            if (structuredPropertyName.Equals("schemaVersion", StringComparison.OrdinalIgnoreCase)
                && StrictSchemaVersionReader.TryReadSchemaVersion(item, out int schemaArrayAlias)
                && schemaArrayAlias > 0)
            {
                continue;
            }

            if (structuredPropertyName.Equals("schemaVersion", StringComparison.OrdinalIgnoreCase)
                && applyTrailingDuplicateArrayPoison
                && SchemaVersionTrailingDuplicateScalarAliasIsPoison(item))
            {
                continue;
            }

            if (IsAggregateStringCalloutPropertyName(structuredPropertyName)
                && AggregateCalloutArrayItemIsDuplicateAliasPoison(item, jsonElement, applyTrailingDuplicateArrayPoison))
            {
                continue;
            }

            if (IsStructuredStringListPropertyName(structuredPropertyName)
                && StructuredStringListArrayItemIsDuplicateAliasPoison(
                    item,
                    jsonElement,
                    structuredPropertyName,
                    applyTrailingDuplicateArrayPoison))
            {
                continue;
            }

            return true;
        }

        return false;
    }

    private static bool IsAggregateStringCalloutPropertyName(string propertyName) =>
        propertyName.Equals("riskPosture", StringComparison.OrdinalIgnoreCase)
        || propertyName.Equals("faithfulnessWarning", StringComparison.OrdinalIgnoreCase);

    private static bool AggregateCalloutArrayItemIsNumericAliasPoison(JsonElement item)
    {
        if (IsZeroConfidenceAliasValue(item) || IsBooleanOneAliasValue(item))
            return true;

        if (item.ValueKind == JsonValueKind.Number)
            return true;

        if (item.ValueKind == JsonValueKind.String
            && TryParseWholeNumberString(item.GetString()?.Trim() ?? string.Empty, out int calloutStringAlias)
            && (calloutStringAlias > 10 || calloutStringAlias == 1))
        {
            return true;
        }

        return false;
    }

    private static bool AggregateCalloutArrayItemIsDuplicateAliasPoison(
        JsonElement item,
        JsonElement parentArray,
        bool applyTrailingDuplicateArrayPoison)
    {
        if (AggregateCalloutArrayItemIsNumericAliasPoison(item))
            return true;

        if (!applyTrailingDuplicateArrayPoison)
            return false;

        if (item.ValueKind == JsonValueKind.Array
            && AggregateCalloutStringArrayHasReadableScalarEntry(item))
        {
            return true;
        }

        if (!ArrayHasSingleNonNullEntry(parentArray))
        {
            if (item.ValueKind == JsonValueKind.String
                && !string.IsNullOrWhiteSpace(item.GetString()))
            {
                return true;
            }

            return false;
        }

        if (item.ValueKind == JsonValueKind.String
            && !string.IsNullOrWhiteSpace(item.GetString()))
        {
            return true;
        }

        return false;
    }

    private static bool CitationArrayItemIsDuplicateAliasPoison(JsonElement item, bool applyTrailingDuplicateArrayPoison)
    {
        if (!applyTrailingDuplicateArrayPoison)
            return false;

        if (item.ValueKind == JsonValueKind.String
            && !string.IsNullOrWhiteSpace(item.GetString()))
        {
            return true;
        }

        if (item.ValueKind == JsonValueKind.Object
            && !string.IsNullOrWhiteSpace(TryReadEvidenceRefObjectStringProperty(item)))
        {
            return true;
        }

        if (item.ValueKind == JsonValueKind.Array
            && CitationNestedArrayHasReadableCitationEntry(item))
        {
            return true;
        }

        return false;
    }

    private static bool CitationNestedArrayHasReadableCitationEntry(JsonElement citationArray)
    {
        foreach (JsonElement item in citationArray.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Array
                && CitationNestedArrayHasReadableCitationEntry(item))
            {
                return true;
            }

            if (item.ValueKind == JsonValueKind.Object
                && !string.IsNullOrWhiteSpace(TryReadEvidenceRefObjectStringProperty(item)))
            {
                return true;
            }

            if (item.ValueKind == JsonValueKind.String
                && !string.IsNullOrWhiteSpace(item.GetString()))
            {
                return true;
            }
        }

        return false;
    }

    private static bool AggregateCalloutStringArrayHasReadableScalarEntry(JsonElement calloutArray)
    {
        foreach (JsonElement item in calloutArray.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Array
                && AggregateCalloutStringArrayHasReadableScalarEntry(item))
            {
                return true;
            }

            if (AggregateCalloutArrayItemIsNumericAliasPoison(item))
                continue;

            if (TryReadNonEmptyTextToken(item, out string? text) && !string.IsNullOrWhiteSpace(text))
                return true;
        }

        return false;
    }

    private static bool AggregateWholeNumberCountArrayHasReadableNumericEntry(JsonElement countArray)
    {
        foreach (JsonElement item in countArray.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Array
                && AggregateWholeNumberCountArrayHasReadableNumericEntry(item))
            {
                return true;
            }

            if (item.ValueKind == JsonValueKind.Number && TryReadWholeNumber(item, out _))
                return true;

            if (item.ValueKind == JsonValueKind.String
                && !string.IsNullOrWhiteSpace(item.GetString())
                && TryParseWholeNumberString(item.GetString()!.Trim(), out _))
            {
                return true;
            }
        }

        return false;
    }

    private static bool StructuredStringListArrayHasReadableScalarEntry(JsonElement stringListArray)
    {
        foreach (JsonElement item in stringListArray.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(item.GetString()))
                return true;

            if (item.ValueKind == JsonValueKind.Number && TryReadWholeNumber(item, out _))
                return true;
        }

        return false;
    }

    private static bool ReasoningArrayHasReadableScalarEntry(JsonElement reasoningArray) =>
        StructuredStringListArrayHasReadableScalarEntry(reasoningArray);

    private static bool ReasoningArrayItemIsDuplicateAliasPoison(JsonElement item, bool applyTrailingDuplicateArrayPoison)
    {
        if (IsBooleanOneAliasValue(item))
            return true;

        if (TryReadFiniteDouble(item) is not null)
            return true;

        if (!applyTrailingDuplicateArrayPoison)
            return false;

        if (item.ValueKind == JsonValueKind.String
            && !string.IsNullOrWhiteSpace(item.GetString()))
        {
            return true;
        }

        if (item.ValueKind == JsonValueKind.Object
            && ReasoningArrayEntryObjectHasExtractableContent(item))
        {
            return true;
        }

        if (item.ValueKind == JsonValueKind.Array
            && ReasoningArrayHasReadableScalarEntry(item))
        {
            return true;
        }

        return false;
    }

    private static bool StructuredStringListArrayItemIsDuplicateAliasPoison(
        JsonElement item,
        JsonElement parentArray,
        string structuredPropertyName,
        bool applyTrailingDuplicateArrayPoison)
    {
        if (IsBooleanOneAliasValue(item))
            return true;

        if (item.ValueKind == JsonValueKind.Number
            && TryReadWholeNumber(item, out int listNumericAlias)
            && listNumericAlias > 10)
        {
            return true;
        }

        if (item.ValueKind == JsonValueKind.String
            && TryParseWholeNumberString(item.GetString()?.Trim() ?? string.Empty, out int listStringAlias)
            && (listStringAlias > 10 || listStringAlias == 1))
        {
            return true;
        }

        if (!applyTrailingDuplicateArrayPoison)
            return false;

        if (!ArrayHasSingleNonNullEntry(parentArray))
        {
            if (item.ValueKind == JsonValueKind.String
                && !string.IsNullOrWhiteSpace(item.GetString()))
            {
                return true;
            }

            if (item.ValueKind == JsonValueKind.Object
                && ProseListObjectAliasHasExtractableContent(item))
            {
                return true;
            }

            return false;
        }

        if (item.ValueKind == JsonValueKind.String
            && !string.IsNullOrWhiteSpace(item.GetString()))
        {
            return true;
        }

        return false;
    }

    private static bool ArrayHasSingleNonNullEntry(JsonElement jsonArray)
    {
        int nonNullEntries = 0;

        foreach (JsonElement entry in jsonArray.EnumerateArray())
        {
            if (entry.ValueKind == JsonValueKind.Null)
                continue;

            nonNullEntries++;

            if (nonNullEntries > 1)
                return false;
        }

        return nonNullEntries == 1;
    }

    private static bool IsRatioPropertyName(string propertyName) =>
        propertyName.Equals("confidence", StringComparison.OrdinalIgnoreCase)
        || propertyName.Equals("faithfulnessSupportRatio", StringComparison.OrdinalIgnoreCase);

    private static bool RatioArrayItemIsDuplicateAliasPoison(JsonElement item)
    {
        if (IsBooleanOneAliasValue(item))
            return true;

        if (item.ValueKind is JsonValueKind.Number or JsonValueKind.String
            && TryReadFiniteDouble(item) is double ratioAlias
            && (ratioAlias > 1 || ratioAlias == 1))
        {
            return true;
        }

        return false;
    }

    private static bool RatioDuplicateScalarAliasIsPoison(JsonElement item)
    {
        if (RatioArrayItemIsDuplicateAliasPoison(item))
            return true;

        if (item.ValueKind == JsonValueKind.String
            && TryParseBooleanString(item.GetString()?.Trim(), out _))
        {
            return true;
        }

        return false;
    }

    private static bool WholeNumberCountTrailingDuplicateAliasIsPoison(JsonElement item)
    {
        if (AggregateWholeNumberCountArrayItemIsDuplicateAliasPoison(item))
            return true;

        if (item.ValueKind == JsonValueKind.String
            && TryParseBooleanString(item.GetString()?.Trim(), out _))
        {
            return true;
        }

        return false;
    }

    private static bool CalloutTrailingDuplicateScalarAliasIsPoison(JsonElement item)
    {
        if (AggregateCalloutArrayItemIsNumericAliasPoison(item))
            return true;

        if (item.ValueKind == JsonValueKind.String
            && TryParseBooleanString(item.GetString()?.Trim(), out _))
        {
            return true;
        }

        return false;
    }

    private static bool StructuredStringListTrailingDuplicateScalarAliasIsPoison(JsonElement item)
    {
        if (IsBooleanOneAliasValue(item))
            return true;

        if (item.ValueKind == JsonValueKind.String
            && TryParseBooleanString(item.GetString()?.Trim(), out _))
        {
            return true;
        }

        if (item.ValueKind == JsonValueKind.String
            && TryParseWholeNumberString(item.GetString()?.Trim() ?? string.Empty, out int listStringAlias)
            && (listStringAlias > 10 || listStringAlias == 1))
        {
            return true;
        }

        if (item.ValueKind == JsonValueKind.Number
            && TryReadWholeNumber(item, out int listNumericAlias)
            && listNumericAlias > 10)
        {
            return true;
        }

        return false;
    }

    private static bool SchemaVersionTrailingDuplicateScalarAliasIsPoison(JsonElement item)
    {
        if (IsBooleanOneAliasValue(item))
            return true;

        if (item.ValueKind == JsonValueKind.String
            && TryParseBooleanString(item.GetString()?.Trim(), out _))
        {
            return true;
        }

        if (item.ValueKind == JsonValueKind.String
            && TryParseWholeNumberString(item.GetString()?.Trim(), out int schemaStringAlias)
            && (schemaStringAlias == 1
                || schemaStringAlias > StructuredExplanationParser.MaxSupportedStructuredExplanationSchemaVersion))
        {
            return true;
        }

        if (item.ValueKind == JsonValueKind.Number
            && StrictSchemaVersionReader.TryReadSchemaVersion(item, out int schemaNumericAlias)
            && (schemaNumericAlias == 1
                || schemaNumericAlias > StructuredExplanationParser.MaxSupportedStructuredExplanationSchemaVersion))
        {
            return true;
        }

        return false;
    }

    private static bool SchemaVersionArrayHasReadableScalarEntry(JsonElement schemaVersionArray)
    {
        foreach (JsonElement item in schemaVersionArray.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Array
                && SchemaVersionArrayHasReadableScalarEntry(item))
            {
                return true;
            }

            if (StrictSchemaVersionReader.TryReadSchemaVersion(item, out _))
                return true;
        }

        return false;
    }

    internal static bool TryReadSchemaVersionFromAggregateAlias(JsonElement element, out int schemaVersion)
    {
        if (StrictSchemaVersionReader.TryReadSchemaVersion(element, out schemaVersion)
            && schemaVersion > 0)
        {
            return true;
        }

        if (element.ValueKind != JsonValueKind.Array)
        {
            schemaVersion = default;

            return false;
        }

        return TryReadSchemaVersionFromArrayItems(element, out schemaVersion);
    }

    private static bool TryReadSchemaVersionFromArrayItems(JsonElement schemaVersionArray, out int schemaVersion)
    {
        foreach (JsonElement item in schemaVersionArray.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Array)
            {
                if (TryReadSchemaVersionFromArrayItems(item, out schemaVersion))
                    return true;

                continue;
            }

            if (StrictSchemaVersionReader.TryReadSchemaVersion(item, out schemaVersion)
                && schemaVersion > 0)
            {
                return true;
            }
        }

        schemaVersion = default;

        return false;
    }

    internal static bool TryReadAggregateStringCalloutToken(JsonElement element, out string? value)
    {
        if (TryReadNonEmptyTextToken(element, out value))
            return true;

        if (element.ValueKind != JsonValueKind.Array)
        {
            value = null;

            return false;
        }

        return TryReadAggregateStringCalloutFromArrayItems(element, out value);
    }

    private static bool TryReadAggregateStringCalloutFromArrayItems(JsonElement calloutArray, out string? value)
    {
        foreach (JsonElement item in calloutArray.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Array)
            {
                if (TryReadAggregateStringCalloutFromArrayItems(item, out value))
                    return true;

                continue;
            }

            if (AggregateCalloutArrayItemIsNumericAliasPoison(item))
                continue;

            if (TryReadNonEmptyTextToken(item, out string? text) && !string.IsNullOrWhiteSpace(text))
            {
                value = text;

                return true;
            }
        }

        value = null;

        return false;
    }

    internal static bool TryReadAggregateWholeNumberCountToken(JsonElement element, out int value)
    {
        if (TryReadWholeNumber(element, out value))
            return true;

        if (element.ValueKind != JsonValueKind.Array)
        {
            value = default;

            return false;
        }

        return TryReadAggregateWholeNumberCountFromArrayItems(element, out value);
    }

    private static bool TryReadAggregateWholeNumberCountFromArrayItems(JsonElement countArray, out int value)
    {
        foreach (JsonElement item in countArray.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Array)
            {
                if (TryReadAggregateWholeNumberCountFromArrayItems(item, out value))
                    return true;

                continue;
            }

            if (AggregateWholeNumberCountArrayItemIsDuplicateAliasPoison(item))
                continue;

            if (TryReadWholeNumber(item, out value))
                return true;
        }

        value = default;

        return false;
    }

    internal static double? TryReadAggregateRatioToken(JsonElement element)
    {
        double? direct = TryReadFiniteDouble(element);

        if (direct is not null)
            return direct;

        if (element.ValueKind != JsonValueKind.Array)
            return null;

        return TryReadAggregateRatioFromArrayItems(element);
    }

    private static double? TryReadAggregateRatioFromArrayItems(JsonElement ratioArray)
    {
        foreach (JsonElement item in ratioArray.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Array)
            {
                double? nestedRatio = TryReadAggregateRatioFromArrayItems(item);

                if (nestedRatio is not null)
                    return nestedRatio;

                continue;
            }

            if (RatioArrayItemIsDuplicateAliasPoison(item))
                continue;

            if (TryReadFiniteDouble(item) is double ratio)
                return ratio;
        }

        return null;
    }

    private static bool AggregateWholeNumberCountArrayItemIsDuplicateAliasPoison(JsonElement item)
    {
        if (IsBooleanOneAliasValue(item))
            return true;

        if (item.ValueKind == JsonValueKind.Number
            && TryReadWholeNumber(item, out int wholeNumberCountAlias)
            && wholeNumberCountAlias > 10)
        {
            return true;
        }

        if (item.ValueKind == JsonValueKind.String
            && TryParseWholeNumberString(item.GetString()?.Trim() ?? string.Empty, out int wholeNumberCountStringAlias)
            && (wholeNumberCountStringAlias > 10 || wholeNumberCountStringAlias == 1))
        {
            return true;
        }

        return false;
    }

    private static bool ConfidenceRatioArrayHasReadableScalarEntry(JsonElement ratioArray)
    {
        foreach (JsonElement item in ratioArray.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Array
                && ConfidenceRatioArrayHasReadableScalarEntry(item))
            {
                return true;
            }

            if (TryReadFiniteDouble(item) is not null)
                return true;
        }

        return false;
    }

    private static bool ArrayContainsOnlyZeroNumericElements(JsonElement jsonElement)
    {
        bool sawZero = false;

        foreach (JsonElement item in jsonElement.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Number && TryReadFiniteDouble(item) is 0)
            {
                sawZero = true;

                continue;
            }

            return false;
        }

        return sawZero;
    }

    private static bool ScalarObjectAliasIsDuplicateAliasPoison(JsonElement jsonElement, string structuredPropertyName)
    {
        if (structuredPropertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase)
            || IsStructuredStringListPropertyName(structuredPropertyName))
        {
            return ProseListObjectAliasHasExtractableContent(jsonElement);
        }

        if (structuredPropertyName.Equals("evidenceRefs", StringComparison.OrdinalIgnoreCase)
            || structuredPropertyName.Equals("citations", StringComparison.OrdinalIgnoreCase))
        {
            return !string.IsNullOrWhiteSpace(TryReadEvidenceRefObjectStringProperty(jsonElement));
        }

        if (structuredPropertyName.Equals("faithfulnessWarning", StringComparison.OrdinalIgnoreCase)
            || structuredPropertyName.Equals("riskPosture", StringComparison.OrdinalIgnoreCase))
        {
            return TryReadNonEmptyTextToken(jsonElement, out string? calloutText)
                && !string.IsNullOrWhiteSpace(calloutText);
        }

        return false;
    }

    private static bool ObjectPropertyValueIsNonEmpty(
        JsonElement jsonElement,
        string structuredPropertyName,
        bool applyTrailingDuplicateArrayPoison = false)
    {
        if (applyTrailingDuplicateArrayPoison
            && ScalarObjectAliasIsDuplicateAliasPoison(jsonElement, structuredPropertyName))
        {
            return false;
        }

        if (structuredPropertyName.Equals("reasoning", StringComparison.OrdinalIgnoreCase)
            || structuredPropertyName.Equals("alternativesConsidered", StringComparison.OrdinalIgnoreCase)
            || structuredPropertyName.Equals("caveats", StringComparison.OrdinalIgnoreCase))
        {
            return ProseListObjectAliasHasExtractableContent(jsonElement);
        }

        if (structuredPropertyName.Equals("evidenceRefs", StringComparison.OrdinalIgnoreCase))
            return ProseListObjectAliasHasExtractableContent(jsonElement);

        if (structuredPropertyName.Equals("citations", StringComparison.OrdinalIgnoreCase))
            return !string.IsNullOrWhiteSpace(TryReadEvidenceRefObjectStringProperty(jsonElement));

        if (structuredPropertyName.Equals("confidence", StringComparison.OrdinalIgnoreCase))
            return StructuredExplanationParser.StructuredConfidenceElementHasReadableValue(jsonElement);

        if (structuredPropertyName.Equals("schemaVersion", StringComparison.OrdinalIgnoreCase))
            return StructuredExplanationParser.StructuredSchemaVersionElementHasReadableValue(jsonElement);

        if (structuredPropertyName.Equals("faithfulnessSupportRatio", StringComparison.OrdinalIgnoreCase))
            return TryReadFiniteDouble(jsonElement) is not null;

        if (IsAggregateWholeNumberCountPropertyName(structuredPropertyName))
            return TryReadWholeNumber(jsonElement, out _);

        if (structuredPropertyName.Equals("riskPosture", StringComparison.OrdinalIgnoreCase)
            || structuredPropertyName.Equals("faithfulnessWarning", StringComparison.OrdinalIgnoreCase))
        {
            return TryReadNonEmptyTextToken(jsonElement, out string? aggregateString)
                && !string.IsNullOrWhiteSpace(aggregateString);
        }

        if (IsDeterministicFallbackPropertyName(structuredPropertyName))
            return TryReadBoolean(jsonElement);

        foreach (JsonProperty property in jsonElement.EnumerateObject())
        {
            if (property.Value.ValueKind is JsonValueKind.Array or JsonValueKind.Object)
                return true;

            if (TryReadNonEmptyTextToken(property.Value, out string? text)
                && !string.IsNullOrWhiteSpace(text))
                return true;
        }

        return false;
    }

    private static bool ReasoningObjectAliasHasExtractableContent(JsonElement jsonElement) =>
        ProseListObjectAliasHasExtractableContent(jsonElement);

    private static bool ProseListObjectAliasHasExtractableContent(JsonElement jsonElement)
    {
        if (TryGetPropertyCaseInsensitivePreferLastNonEmpty(jsonElement, "text", out JsonElement textElement)
            && TryReadNonEmptyTextToken(textElement, out string? text)
            && !string.IsNullOrWhiteSpace(text))
        {
            return true;
        }

        if (ObjectHasCaseInsensitiveProperty(jsonElement, "text"))
            return false;

        if (TryGetPropertyCaseInsensitivePreferLastNonEmpty(jsonElement, "id", out JsonElement idElement)
            && TryReadNonEmptyTextToken(idElement, out string? id)
            && !string.IsNullOrWhiteSpace(id))
        {
            return true;
        }

        return false;
    }

    private static bool ObjectHasCaseInsensitiveProperty(JsonElement jsonElement, string propertyName)
    {
        foreach (JsonProperty property in jsonElement.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static bool ReasoningArrayEntryObjectHasExtractableContent(JsonElement jsonElement) =>
        ProseListObjectAliasHasExtractableContent(jsonElement);

    internal static string? TryReadProseListObjectStringProperty(JsonElement jsonElement)
    {
        if (TryGetPropertyCaseInsensitivePreferLastNonEmpty(jsonElement, "text", out JsonElement textElement)
            && TryReadNonEmptyTextToken(textElement, out string? text)
            && !string.IsNullOrWhiteSpace(text))
        {
            return text.Trim();
        }

        if (ObjectHasCaseInsensitiveProperty(jsonElement, "text"))
            return null;

        if (TryGetPropertyCaseInsensitivePreferLastNonEmpty(jsonElement, "id", out JsonElement idElement)
            && TryReadNonEmptyTextToken(idElement, out string? id)
            && !string.IsNullOrWhiteSpace(id))
        {
            return id.Trim();
        }

        return null;
    }

    internal static string? TryReadEvidenceRefObjectStringProperty(
        JsonElement jsonElement,
        bool blankTextWithIdIsInArrayPoison = true)
    {
        string? readableText = null;

        if (TryGetPropertyCaseInsensitivePreferLastNonEmpty(jsonElement, "text", out JsonElement textElement)
            && TryReadNonEmptyTextToken(textElement, out string? text)
            && !string.IsNullOrWhiteSpace(text))
        {
            readableText = text.Trim();
        }

        string? readableId = null;

        if (TryGetPropertyCaseInsensitivePreferLastNonEmpty(jsonElement, "id", out JsonElement idElement)
            && TryReadNonEmptyTextToken(idElement, out string? id)
            && !string.IsNullOrWhiteSpace(id))
        {
            readableId = id.Trim();
        }

        if (readableText is not null && readableId is not null)
            return readableId;

        if (readableText is not null)
            return readableText;

        // In-array entries use blank `text` + `id` as poison; scalar object aliases may still expose the id.

        if (blankTextWithIdIsInArrayPoison
            && ObjectHasCaseInsensitiveProperty(jsonElement, "text"))
        {
            return null;
        }

        if (readableId is not null)
            return readableId;

        return null;
    }
}
