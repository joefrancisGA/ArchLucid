using System.Globalization;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Pilots;

/// <inheritdoc cref="IExecutionProvenanceFooterRenderer" />
public sealed class ExecutionProvenanceFooterRenderer : IExecutionProvenanceFooterRenderer
{
    /// <inheritdoc />
    public string BuildYellowSimulatorSubstitutionCallout()
    {
        return """
               > [!WARNING]
               > Real Azure OpenAI execution failed and was substituted with simulator output. The numbers below are deterministic placeholders, not LLM-generated. See `docs/runbooks/AGENT_EXECUTION_FAILURES.md` for triage.
               """;
    }

    /// <inheritdoc />
    public string BuildFooterMarkdown(ExecutionProvenanceFooterInput input)
    {
        ArgumentNullException.ThrowIfNull(input);

        string modeLabel = ResolveModeLabel(input);
        string fallbackDetailRow = input.PersistedStructuralExecutionMode == StructuralExecutionMode.Fallback
            ? "| Fallback path | Real → Simulator (fallback) |\n"
            : string.Empty;
        string deployment = input.RealModeFellBackToSimulator
            ? ResolveDeploymentValue(input.PilotAoaiDeploymentSnapshot, "Deployment snapshot was not stored.")
            : ResolveDeploymentValue(input.HostAzureOpenAiDeploymentName, "Azure OpenAI deployment was not stored.");

        return $"""
                ## Execution provenance

                | Field | Value |
                | --- | --- |
                | Mode | {modeLabel} |
                {fallbackDetailRow}| LLM completion traces (this run) | {input.LlmCompletionTraceCount.ToString(CultureInfo.InvariantCulture)} |
                | Azure OpenAI deployment (when known) | `{deployment}` |

                _Token totals per provider are not aggregated in this report; trace count reflects persisted completion attempts._
                """;
    }

    private static string ResolveModeLabel(ExecutionProvenanceFooterInput input) =>
        StructuralExecutionModeLabels.ToDisplayLabel(input.PersistedStructuralExecutionMode);

    private static string ResolveDeploymentValue(string? value, string omittedMessage) =>
        IsOmitted(value) ? omittedMessage : value ?? string.Empty;

    private static bool IsOmitted(string? value) =>
        value is null || (value.Length > 0 && string.IsNullOrWhiteSpace(value));
}
