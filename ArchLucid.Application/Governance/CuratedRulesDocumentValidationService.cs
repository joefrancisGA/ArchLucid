using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace ArchLucid.Application.Governance;

public sealed partial class CuratedRulesDocumentValidationService : ICuratedRulesDocumentValidationService
{
    private const string CuratedRulesDocumentKind = "archlucid.policyPack.curatedRules.v1";

    private static readonly HashSet<string> AllowedSeverities = new(StringComparer.Ordinal)
    {
        "Critical",
        "High",
        "Medium",
        "Low",
    };

    private const int MinimumTitleLength = 8;
    private const int MinimumDescriptionLength = 24;
    private const int MaximumRuleCountBeforeWarning = 8;

    public CuratedRulesDocumentValidationResult Validate(JsonObject document)
    {
        ArgumentNullException.ThrowIfNull(document);

        List<string> errors = [];
        List<string> warnings = [];

        ValidateDocumentShape(document, errors);
        ValidatePack(document, errors);
        ValidateRules(document, errors, warnings);

        return new CuratedRulesDocumentValidationResult
        {
            Errors = errors,
            Warnings = warnings,
        };
    }

    private static void ValidateDocumentShape(JsonObject document, List<string> errors)
    {
        int? schemaVersion = document["schemaVersion"]?.GetValue<int?>();

        if (schemaVersion != 1)
            errors.Add("schemaVersion must be 1.");

        string? kind = document["kind"]?.GetValue<string>();

        if (!string.Equals(kind, CuratedRulesDocumentKind, StringComparison.Ordinal))
            errors.Add($"kind must be '{CuratedRulesDocumentKind}'.");
    }

    private static void ValidatePack(JsonObject document, List<string> errors)
    {
        JsonObject? pack = document["pack"] as JsonObject;

        if (pack is null)
        {
            errors.Add("pack object is required.");

            return;
        }

        if (string.IsNullOrWhiteSpace(pack["name"]?.GetValue<string>()))
            errors.Add("pack.name is required.");
    }

    private static void ValidateRules(JsonObject document, List<string> errors, List<string> warnings)
    {
        JsonArray? rules = document["rules"] as JsonArray;

        if (rules is null || rules.Count == 0)
        {
            errors.Add("At least one rule is required after normalization.");

            return;
        }

        if (rules.Count > MaximumRuleCountBeforeWarning)
        {
            warnings.Add(
                $"Document contains {rules.Count} rules; the generator prompt targets 1–5 rules — review for bloat.");
        }

        HashSet<string> seenRuleIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonNode? node in rules)
        {
            if (node is not JsonObject rule)
            {
                errors.Add("Each rules[] entry must be an object.");

                continue;
            }

            ValidateRule(rule, seenRuleIds, errors, warnings);
        }
    }

    private static void ValidateRule(
        JsonObject rule,
        HashSet<string> seenRuleIds,
        List<string> errors,
        List<string> warnings)
    {
        string? id = rule["id"]?.GetValue<string>()?.Trim();

        if (string.IsNullOrWhiteSpace(id))
        {
            errors.Add("Each rule must have a non-empty id.");

            return;
        }

        if (!KebabCaseRuleIdPattern().IsMatch(id))
            errors.Add($"Rule id '{id}' must be kebab-case (lowercase letters, digits, hyphens).");

        if (!seenRuleIds.Add(id))
            errors.Add($"Duplicate rule id '{id}'.");

        string? severity = rule["severity"]?.GetValue<string>()?.Trim();

        if (string.IsNullOrWhiteSpace(severity) || !AllowedSeverities.Contains(severity))
        {
            errors.Add(
                $"Rule '{id}' has invalid severity '{severity ?? "(missing)"}'; expected Critical, High, Medium, or Low.");
        }

        string? title = rule["title"]?.GetValue<string>()?.Trim();

        if (title is not null && title.Length < MinimumTitleLength)
        {
            warnings.Add($"Rule '{id}' title is shorter than {MinimumTitleLength} characters — review before publish.");
        }

        string? description = rule["description"]?.GetValue<string>()?.Trim();

        if (description is not null && description.Length < MinimumDescriptionLength)
        {
            warnings.Add(
                $"Rule '{id}' description is shorter than {MinimumDescriptionLength} characters — review before publish.");
        }

        if (string.IsNullOrWhiteSpace(rule["remediationGuidance"]?.GetValue<string>()))
            warnings.Add($"Rule '{id}' has empty remediationGuidance.");

        JsonArray? evidenceHints = rule["evidenceHints"] as JsonArray;

        if (evidenceHints is null || evidenceHints.Count == 0)
            warnings.Add($"Rule '{id}' has empty evidenceHints.");

        JsonArray? frameworkMappings = rule["frameworkMappings"] as JsonArray;

        if (frameworkMappings is null)
            return;

        foreach (JsonNode? mappingNode in frameworkMappings)
        {
            if (mappingNode is not JsonObject mapping)
                continue;

            if (string.IsNullOrWhiteSpace(mapping["framework"]?.GetValue<string>())
                || string.IsNullOrWhiteSpace(mapping["requirement"]?.GetValue<string>()))
            {
                warnings.Add($"Rule '{id}' has a frameworkMappings entry missing framework or requirement.");
            }
        }
    }

    [GeneratedRegex("^[a-z0-9]+(-[a-z0-9]+)*$", RegexOptions.CultureInvariant)]
    private static partial Regex KebabCaseRuleIdPattern();
}
