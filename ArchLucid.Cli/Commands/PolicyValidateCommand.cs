using System.Text.Json;

using ArchLucid.Cli.Validation;
using ArchLucid.Contracts.Governance;
using FluentValidation.Results;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid policy validate &lt;file.json&gt;</c> and <c>archlucid policy-pack validate &lt;file.json&gt;</c> —
///     deserializes a <see cref="PolicyPackContentDocument" />, runs FluentValidation, and reports structural issues (no YAML).
/// </summary>
internal static class PolicyValidateCommand
{
    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    private static readonly JsonSerializerOptions JsonOutCamel = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private static readonly PolicyPackContentDocumentValidator ContentValidator = new();

    /// <param name="jsonPath">Path to policy pack content JSON.</param>
    /// <param name="commandLabel">Printed in human-readable errors (e.g. <c>policy validate</c> vs <c>policy-pack validate</c>).</param>
    public static Task<int> RunAsync(string jsonPath, string commandLabel = "policy validate")
    {
        string path = Path.GetFullPath(jsonPath.Trim());

        if (!File.Exists(path))
        {
            WriteErr(commandLabel, CliExitCode.OperationFailed, $"File not found: {path}");

            return Task.FromResult(CliExitCode.OperationFailed);
        }

        string raw;

        try
        {
            raw = File.ReadAllText(path);
        }
        catch (Exception ex)
        {
            WriteErr(commandLabel, CliExitCode.OperationFailed, $"Could not read file: {ex.Message}");

            return Task.FromResult(CliExitCode.OperationFailed);
        }

        string trimmed = raw.TrimStart();

        if (trimmed.Length == 0)
        {
            WriteErr(commandLabel, CliExitCode.UsageError, "File is empty.");

            return Task.FromResult(CliExitCode.UsageError);
        }

        if (trimmed[0] is not '{')
        {
            WriteErr(
                commandLabel,
                CliExitCode.UsageError,
                "Expected a JSON object (policy pack content uses JSON; use yaml-to-json tooling for YAML packs).");

            return Task.FromResult(CliExitCode.UsageError);
        }

        PolicyPackContentDocument? doc;

        try
        {
            doc = JsonSerializer.Deserialize<PolicyPackContentDocument>(raw, Json);
        }
        catch (JsonException jx)
        {
            WriteErr(commandLabel, CliExitCode.UsageError, $"Invalid JSON: {jx.Message}");

            return Task.FromResult(CliExitCode.UsageError);
        }

        if (doc is null)
        {
            WriteErr(commandLabel, CliExitCode.UsageError, "Deserialized document is null.");

            return Task.FromResult(CliExitCode.UsageError);
        }

        List<PolicyPackContentValidationIssue> issues = [];
        ValidationResult fv = ContentValidator.Validate(doc);

        foreach (ValidationFailure failure in fv.Errors)
        {
            issues.Add(new PolicyPackContentValidationIssue
            {
                Kind = PolicyPackContentValidationIssueKind.Error,
                Message = failure.ErrorMessage,
                Path = string.IsNullOrWhiteSpace(failure.PropertyName) ? null : failure.PropertyName,
            });
        }

        AppendUnknownRuleKeyWarnings(doc, issues);

        bool valid = issues.All(static issue => issue.Kind != PolicyPackContentValidationIssueKind.Error);

        if (!valid)
        {
            string detail = string.Join("; ", issues
                .Where(static issue => issue.Kind == PolicyPackContentValidationIssueKind.Error)
                .Select(static issue => issue.Message));

            WriteErr(commandLabel, CliExitCode.UsageError, detail);

            return Task.FromResult(CliExitCode.UsageError);
        }

        PolicyPackContentValidationSummary summary = BuildSummary(doc);

        if (CliExecutionContext.JsonOutput)
        {
            Dictionary<string, object?> payload = new()
            {
                ["ok"] = true,
                ["valid"] = true,
                ["summary"] = summary,
                ["issues"] = issues,
            };

            Console.WriteLine(JsonSerializer.Serialize(payload, JsonOutCamel));
        }
        else
        {
            Console.WriteLine(
                $"Valid policy pack JSON: {path} " +
                $"(compliance rules: {summary.ComplianceRuleIdCount + summary.ComplianceRuleKeyCount}, " +
                $"alerts: {summary.AlertRuleIdCount + summary.CompositeAlertRuleIdCount}, " +
                $"advisory defaults: {summary.AdvisoryDefaultCount}).");

            foreach (PolicyPackContentValidationIssue warning in issues
                         .Where(static issue => issue.Kind == PolicyPackContentValidationIssueKind.Warning))
            {
                Console.WriteLine($"[warning] {warning.Message}");
            }
        }

        return Task.FromResult(CliExitCode.Success);
    }

    private static void AppendUnknownRuleKeyWarnings(
        PolicyPackContentDocument document,
        List<PolicyPackContentValidationIssue> issues)
    {
        HashSet<string> knownRuleKeys = PolicyPackKnownRuleKeyResolver.TryLoadKnownRuleKeys();

        foreach (string curatedRuleId in PolicyPackCuratedRuleKeyReader.ReadRuleIdsFromMetadata(document.Metadata))
            knownRuleKeys.Add(curatedRuleId);

        if (knownRuleKeys.Count == 0)
            return;

        foreach (string ruleKey in document.ComplianceRuleKeys)
        {
            if (string.IsNullOrWhiteSpace(ruleKey))
                continue;

            string trimmed = ruleKey.Trim();

            if (knownRuleKeys.Contains(trimmed))
                continue;

            issues.Add(new PolicyPackContentValidationIssue
            {
                Kind = PolicyPackContentValidationIssueKind.Warning,
                Path = "complianceRuleKeys",
                Message =
                    $"Unknown complianceRuleKey '{trimmed}' is not in the GA file-based rule library or curated rules in this document.",
            });
        }
    }

    private static PolicyPackContentValidationSummary BuildSummary(PolicyPackContentDocument document) =>
        new()
        {
            ComplianceRuleIdCount = document.ComplianceRuleIds.Count,
            ComplianceRuleKeyCount = document.ComplianceRuleKeys.Count,
            AlertRuleIdCount = document.AlertRuleIds.Count,
            CompositeAlertRuleIdCount = document.CompositeAlertRuleIds.Count,
            AdvisoryDefaultCount = document.AdvisoryDefaults.Count,
            MetadataEntryCount = document.Metadata.Count,
            ElicitationQuestionCount = document.ElicitationQuestions.Count,
        };

    private static void WriteErr(string commandLabel, int exitCode, string message)
    {
        if (CliExecutionContext.JsonOutput)
            CliJson.WriteFailureLine(Console.Error, exitCode, "policy_pack_validate", message);
        else
            Console.Error.WriteLine($"[{commandLabel}] {message}");
    }
}
