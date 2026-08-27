using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Authorization;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class PolicyPacksController
{
    /// <summary>Simulates proposed pack content against a single run's findings without persisting a pack.</summary>
    [HttpPost("simulate")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [EnableRateLimiting("governancePolicyPackDryRun")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PolicyPackGovernanceDryRunResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Simulate(
        [FromBody] PolicyPackSimulateRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(request.RunId))
        {
            return this.BadRequestProblem("runId is required.", ProblemTypes.ValidationFailed);
        }

        if (request.Content is null)
        {
            return this.BadRequestProblem("content is required.", ProblemTypes.ValidationFailed);
        }

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        PolicyPackGovernanceDryRunResult? result = await _workflow.SimulateAsync(
            request.Content,
            request.RunId,
            request.BlockCommitOnCritical,
            request.BlockCommitMinimumSeverity,
            request.ProposedPolicyPackId,
            cancellationToken);

        if (result is null)
            return this.NotFoundProblem(
                "The target run was not found in the current tenant/workspace/project scope.",
                ProblemTypes.ResourceNotFound);

        return Ok(result);
    }

    /// <summary>Simulates the pack's latest version content against many runs.</summary>
    [HttpPost("{policyPackId:guid}/simulate-bulk")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [EnableRateLimiting("governancePolicyPackDryRun")]
    [ProducesResponseType(typeof(PolicyPackSimulateBulkSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SimulateBulk(
        Guid policyPackId,
        [FromBody] PolicyPackSimulateBulkRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (request.RunIds.Count == 0)
            return this.BadRequestProblem("RunIds must contain at least one id.", ProblemTypes.ValidationFailed);

        if (request.RunIds.Count > 50)
            return this.BadRequestProblem("At most 50 run ids are allowed per request.", ProblemTypes.ValidationFailed);

        if (!request.RunIds.Any(static id => !string.IsNullOrWhiteSpace(id)))
        {
            return this.BadRequestProblem(
                "RunIds must contain at least one non-empty id.",
                ProblemTypes.ValidationFailed);
        }

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        PolicyPackSimulateBulkSummary? summary = await _workflow.TrySimulateBulkAsync(
            policyPackId,
            request.RunIds,
            request.BlockCommitOnCritical,
            request.BlockCommitMinimumSeverity,
            cancellationToken);

        if (summary is null)
            return this.NotFoundProblem(
                $"Policy pack '{policyPackId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        return Ok(MapBulkSummary(summary));
    }

    /// <summary>Validates raw policy pack content JSON against structural rules without persisting a pack.</summary>
    [HttpPost("validate")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PolicyPackContentValidationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Validate([FromBody] JsonElement? body, CancellationToken cancellationToken)
    {
        if (body is null || body.Value.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (body.Value.ValueKind is not JsonValueKind.Object)
            return this.BadRequestProblem("Expected a JSON object.", ProblemTypes.ValidationFailed);

        PolicyPackContentDocument? document;

        try
        {
            document = JsonSerializer.Deserialize<PolicyPackContentDocument>(
                body.Value.GetRawText(),
                ContractJson.CamelCaseIgnoreNullCompact);
        }
        catch (JsonException jsonException)
        {
            return this.BadRequestProblem(
                $"Invalid JSON: {jsonException.Message}",
                ProblemTypes.ValidationFailed);
        }

        if (document is null)
            return this.BadRequestProblem("Deserialized document is null.", ProblemTypes.ValidationFailed);

        IActionResult? tenantProblem = await RequireTenantOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        PolicyPackContentValidationResponse response =
            await _workflow.ValidateContentAsync(document, cancellationToken);

        return Ok(response);
    }

    private static PolicyPackSimulateBulkSummaryResponse MapBulkSummary(PolicyPackSimulateBulkSummary summary) =>
        new()
        {
            PolicyPackId = summary.PolicyPackId,
            PolicyPackVersion = summary.PolicyPackVersion,
            RequestedRunCount = summary.RequestedRunCount,
            EvaluatedRunCount = summary.EvaluatedRunCount,
            NotFoundRunCount = summary.NotFoundRunCount,
            WouldBlockCommitCount = summary.WouldBlockCommitCount,
            Results = summary.Results
                .Select(static result => new PolicyPackSimulateBulkRunResult
                {
                    RunId = result.RunId,
                    Found = result.Found,
                    WouldBlockCommit = result.WouldBlockCommit,
                    Detail = result.Detail,
                })
                .ToList(),
        };
}
