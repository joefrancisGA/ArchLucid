namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     String fields on <see cref="ArchLucid.Contracts.Requests.ArchitectureRequest" /> that are intentionally
///     excluded from prompt-injection scanning, with rationale for architecture coverage tests.
/// </summary>
internal static class ArchitectureRequestContentSafetyScanExemptions
{
    internal static IReadOnlyDictionary<string, string> ExemptionReasons { get; } =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            [nameof(ArchLucid.Contracts.Requests.ArchitectureRequest.RequestId)] =
                "Opaque client correlation id (max 64); format-validated at create; not composed into agent objective prose.",
            [nameof(ArchLucid.Contracts.Requests.ArchitectureRequest.PriorRunId)] =
                "Prior-run pointer validated against tenant scope at create; not free-text agent input.",
            [nameof(ArchLucid.Contracts.Requests.ArchitectureRequest.PriorManifestVersion)] =
                "Manifest version label token; not natural-language agent context.",
            [nameof(ArchLucid.Contracts.Requests.ArchitectureRequest.EffectiveModelAliasId)] =
                "Server-frozen engine alias from workspace allowlist at run create.",
            [nameof(ArchLucid.Contracts.Requests.ArchitectureRequest.ModelAliasOverride)] =
                "Validated against workspace allowed engine aliases at create (closed vocabulary).",
            [nameof(ArchLucid.Contracts.Requests.ArchitectureRequest.ModelExecutionProfileOverride)] =
                "Closed execution profile vocabulary (Economy/Balanced/HighAssurance) validated at create.",
            [nameof(ArchLucid.Contracts.Requests.ArchitectureRequest.WorkflowIntent)] =
                "Closed workflow intent token from homepage CTAs; validated at create.",
            [nameof(ArchLucid.Contracts.Requests.ArchitectureRequest.RequestSource)] =
                "Telemetry channel label (wizard/cli); not agent objective text.",
            [nameof(ArchLucid.Contracts.Requests.ArchitectureRequest.WizardPresetUsed)] =
                "Wizard preset token (greenfield/modernize/blank); not agent objective text.",
            ["Documents[].ContentType"] =
                "MIME type constrained to SupportedContextDocumentContentTypes at ingest validation.",
            ["InfrastructureDeclarations[].Format"] =
                "Declaration format token validated against supported IaC format allowlist at ingest.",
            ["IntakeTransparencyTrail.Asserted[].Key"] =
                "Stable catalog key for asserted trail row; not user prose.",
            ["IntakeTransparencyTrail.Asserted[].QuestionId"] =
                "Elicitation question catalog id; not user prose.",
            ["IntakeTransparencyTrail.Inferred[].Key"] =
                "Stable catalog key for inferred trail row; not user prose.",
            ["IntakeTransparencyTrail.Skipped[].QuestionKey"] =
                "Elicitation question catalog key; not user prose.",
            ["IntakeQuestionAnswers[].Key"] =
                "Intake question id key; answer values are scanned separately.",
        };

    internal static bool IsExempt(string propertyPath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(propertyPath);

        if (ExemptionReasons.ContainsKey(propertyPath))
            return true;

        if (propertyPath.EndsWith(".Key", StringComparison.Ordinal)
            && propertyPath.Contains("IntakeQuestionAnswers", StringComparison.Ordinal))
        {
            return true;
        }

        return false;
    }
}
