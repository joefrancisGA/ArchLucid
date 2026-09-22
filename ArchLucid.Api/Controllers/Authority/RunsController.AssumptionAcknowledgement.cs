using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Server-persisted pre-finalize assumption acknowledgements (TB-2345 item 49).</summary>
public sealed partial class RunsController
{
    private const int MaxAcknowledgedAssumptionIds = 500;
    private const int MaxAcknowledgedAssumptionIdLength = 128;

    [HttpGet("review/{runId:guid}/assumptions/acknowledgement")]
    [ProducesResponseType(typeof(RunAssumptionAcknowledgementDocument), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetAssumptionAcknowledgement(
        Guid runId,
        [FromServices] IRunAssumptionAcknowledgementService acknowledgementService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(acknowledgementService);

        IActionResult? sealedGuardResult = await EnsureRunSealedManifestReadAllowedAsync(runId, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        try
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            RunAssumptionAcknowledgementDocument document =
                await acknowledgementService.GetAsync(scope, runId, cancellationToken);

            return Ok(document);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (ConflictException ex)
        {
            return MapRunsSealedManifestConflict(ex);
        }
    }

    [HttpPut("review/{runId:guid}/assumptions/acknowledgement")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: RunAssumptionAcknowledgementService persists the document and logs RunAssumptionsAcknowledged.")]
    [ProducesResponseType(typeof(RunAssumptionAcknowledgementDocument), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PutAssumptionAcknowledgement(
        Guid runId,
        [FromBody] PutRunAssumptionAcknowledgementRequest? request,
        [FromServices] IRunAssumptionAcknowledgementService acknowledgementService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(acknowledgementService);

        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IReadOnlyList<string> ids = request.AcknowledgedAssumptionIds ?? [];

        if (ids.Count > MaxAcknowledgedAssumptionIds)
            return this.BadRequestProblem(
                $"At most {MaxAcknowledgedAssumptionIds} assumption ids may be acknowledged per run.",
                ProblemTypes.ValidationFailed);

        if (ids.Any(static id => id is { Length: > MaxAcknowledgedAssumptionIdLength }))
            return this.BadRequestProblem(
                $"Assumption ids must be at most {MaxAcknowledgedAssumptionIdLength} characters.",
                ProblemTypes.ValidationFailed);

        if (ids.Any(static id => !IsValidUnicodeText(id)))
            return this.BadRequestProblem(
                "Assumption ids must not contain invalid Unicode surrogate pairs.",
                ProblemTypes.ValidationFailed);

        IActionResult? sealedGuardResult = await EnsureRunSealedManifestReadAllowedAsync(runId, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        try
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            RunAssumptionAcknowledgementDocument saved =
                await acknowledgementService.PutAsync(scope, runId, ids, cancellationToken);

            return Ok(saved);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (ConflictException ex)
        {
            return MapRunsSealedManifestConflict(ex);
        }
    }

    private static bool IsValidUnicodeText(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return true;

        for (int i = 0; i < value.Length; i++)
        {
            if (!char.IsSurrogate(value[i]))
                continue;

            if (i + 1 >= value.Length || !char.IsSurrogatePair(value[i], value[i + 1]))
                return false;

            i++;
        }

        return true;
    }
}
