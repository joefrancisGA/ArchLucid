using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPacks;

public sealed partial class PolicyPackHttpFacade
{
    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPackGovernanceDryRunResult>> SimulateAsync(
        PolicyPackContentDocument content,
        string runId,
        bool? blockCommitOnCritical,
        int? blockCommitMinimumSeverity,
        Guid? proposedPolicyPackId,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPackGovernanceDryRunResult>.ScopeNotFound();

        PolicyPackGovernanceDryRunResult? result = await _workflow.SimulateAsync(
            content,
            runId,
            blockCommitOnCritical,
            blockCommitMinimumSeverity,
            proposedPolicyPackId,
            ct).ConfigureAwait(false);

        return result is null
            ? new PolicyPackHttpResult<PolicyPackGovernanceDryRunResult> { Outcome = PolicyPackHttpOutcome.ResourceNotFound }
            : PolicyPackHttpResult<PolicyPackGovernanceDryRunResult>.Success(result);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPackSimulateBulkSummary>> SimulateBulkAsync(
        Guid policyPackId,
        IReadOnlyList<string> runIds,
        bool? blockCommitOnCritical,
        int? blockCommitMinimumSeverity,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPackSimulateBulkSummary>.ScopeNotFound();

        PolicyPackSimulateBulkSummary? summary = await _workflow.TrySimulateBulkAsync(
            policyPackId,
            runIds,
            blockCommitOnCritical,
            blockCommitMinimumSeverity,
            ct).ConfigureAwait(false);

        return summary is null
            ? new PolicyPackHttpResult<PolicyPackSimulateBulkSummary> { Outcome = PolicyPackHttpOutcome.ResourceNotFound }
            : PolicyPackHttpResult<PolicyPackSimulateBulkSummary>.Success(summary);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPackContentValidationResponse>> ValidateContentAsync(
        JsonElement body,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPackContentValidationResponse>.ScopeNotFound();

        if (body.ValueKind is not JsonValueKind.Object)
        {
            return new PolicyPackHttpResult<PolicyPackContentValidationResponse>
            {
                Outcome = PolicyPackHttpOutcome.ValidationFailed,
                Message = "Expected a JSON object.",
            };
        }

        PolicyPackContentDocument? document;

        try
        {
            document = JsonSerializer.Deserialize<PolicyPackContentDocument>(
                body.GetRawText(),
                ContractJson.CamelCaseIgnoreNullCompact);
        }
        catch (JsonException jsonException)
        {
            return new PolicyPackHttpResult<PolicyPackContentValidationResponse>
            {
                Outcome = PolicyPackHttpOutcome.ValidationFailed,
                Message = $"Invalid JSON: {jsonException.Message}",
            };
        }

        if (document is null)
        {
            return new PolicyPackHttpResult<PolicyPackContentValidationResponse>
            {
                Outcome = PolicyPackHttpOutcome.ValidationFailed,
                Message = "Deserialized document is null.",
            };
        }

        PolicyPackContentValidationResponse response =
            await _workflow.ValidateContentAsync(document, ct).ConfigureAwait(false);

        return PolicyPackHttpResult<PolicyPackContentValidationResponse>.Success(response);
    }
}
