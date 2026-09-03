using System.Text.Json;

namespace ArchLucid.Core.GoldenCorpus;

public static partial class RealLlmOutputStructuralValidator
{
    private static readonly string[] FindingContentFields = ["description", "message", "title", "detail"];

    private static RealLlmStructuralValidationResult? ValidateFindings(JsonElement root, List<RealLlmStructuralCheckItem> checks)
    {
        if (!TryGetPropertyCaseInsensitive(root, "findings", out JsonElement findings) || findings.ValueKind != JsonValueKind.Array || findings.GetArrayLength() == 0)
        {
            checks.Add(new RealLlmStructuralCheckItem("findingsNonEmpty", false, "Property 'findings' must be a non-empty JSON array."));
            return new RealLlmStructuralValidationResult(false, checks);
        }
        checks.Add(new RealLlmStructuralCheckItem("findingsNonEmpty", true, "Findings array is non-empty."));
        int index = 0;
        foreach (JsonElement finding in findings.EnumerateArray())
        {
            if (finding.ValueKind != JsonValueKind.Object)
            {
                checks.Add(new RealLlmStructuralCheckItem("findingObject", false, $"findings[{index.ToString(System.Globalization.CultureInfo.InvariantCulture)}] must be an object."));
                return new RealLlmStructuralValidationResult(false, checks);
            }
            RealLlmStructuralValidationResult? traceResult = ValidateFindingTrace(finding, index, checks);
            if (traceResult is not null) return traceResult;
            if (!TryGetPropertyCaseInsensitive(finding, "severity", out JsonElement severityEl) || !TryReadNonEmptyTextToken(severityEl, out _))
            {
                checks.Add(new RealLlmStructuralCheckItem("findingSeverity", false, $"findings[{index.ToString(System.Globalization.CultureInfo.InvariantCulture)}] must have a non-empty string 'severity'."));
                return new RealLlmStructuralValidationResult(false, checks);
            }
            bool hasContent = FindingContentFields.Any(f => TryGetPropertyCaseInsensitive(finding, f, out JsonElement el) && TryReadNonEmptyTextToken(el, out _));
            if (!hasContent)
            {
                checks.Add(new RealLlmStructuralCheckItem("findingContent", false, $"findings[{index.ToString(System.Globalization.CultureInfo.InvariantCulture)}] must have at least one non-empty content field (description, message, title, or detail)."));
                return new RealLlmStructuralValidationResult(false, checks);
            }
            index++;
        }
        return null;
    }
}
