using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Application.InfraEvidence.OperatorInferredConnections;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.InfraEvidence;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/infra-evidence/snapshots/{snapshotId:guid}/operator-inferred-connections")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class InfraEvidenceOperatorInferredConnectionsController(
    IOperatorInferredConnectionService connectionService,
    IScopeContextProvider scopeProvider,
    IActorContext actorContext) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<OperatorInferredConnectionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(Guid snapshotId, CancellationToken cancellationToken = default)
    {
        if (snapshotId == Guid.Empty)
        {
            return this.BadRequestProblem("SnapshotId is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();
        IReadOnlyList<OperatorInferredConnectionRecord> records =
            await connectionService.ListBySnapshotAsync(scope, snapshotId, cancellationToken);

        return Ok(records.Select(MapResponse).ToList());
    }

    [HttpGet("questionnaire")]
    [ProducesResponseType(typeof(InferenceQuestionnaireListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListQuestionnaire(Guid snapshotId, CancellationToken cancellationToken = default)
    {
        if (snapshotId == Guid.Empty)
        {
            return this.BadRequestProblem("SnapshotId is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();
        IReadOnlyList<OperatorInferredConnectionRecord> records =
            await connectionService.ListBySnapshotAsync(scope, snapshotId, cancellationToken);

        IReadOnlyList<OperatorInferredConnectionResponse> questionnaireItems = records
            .Where(record => record.Source == OperatorInferredConnectionSource.Questionnaire)
            .Select(MapResponse)
            .ToList();

        return Ok(new InferenceQuestionnaireListResponse
        {
            Items = questionnaireItems,
            TotalCount = questionnaireItems.Count,
            Cap = InferenceQuestionnaireItemGenerator.MaxItems,
            CapReached = questionnaireItems.Count >= InferenceQuestionnaireItemGenerator.MaxItems,
        });
    }

    [HttpPost("confirm")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: OperatorInferredConnectionService logs confirm via IAuditService.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Confirm(
        Guid snapshotId,
        [FromBody] OperatorInferredConnectionConfirmApiRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (snapshotId == Guid.Empty)
        {
            return this.BadRequestProblem("SnapshotId is required.", ProblemTypes.ValidationFailed);
        }

        if (request is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string actorId = actorContext.GetActorId();

        OperatorInferredConnectionMutationResult result = await connectionService.ConfirmAsync(
            scope,
            snapshotId,
            new OperatorInferredConnectionConfirmRequest
            {
                ConnectionId = request.ConnectionId,
                FromCloudResourceId = request.FromCloudResourceId,
                ToCloudResourceId = request.ToCloudResourceId,
                ToArmId = request.ToArmId,
                ToCatalog = request.ToCatalog,
            },
            actorId,
            cancellationToken);

        if (!result.Succeeded)
        {
            if (string.Equals(result.ErrorMessage, "Inferred connection was not found.", StringComparison.Ordinal))
            {
                return this.NotFoundProblem(
                    result.ErrorMessage ?? "Inferred connection was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            return this.BadRequestProblem(
                result.ErrorMessage ?? "Confirm inferred connection failed.",
                ProblemTypes.ValidationFailed);
        }

        return NoContent();
    }

    [HttpPost("dismiss")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: OperatorInferredConnectionService logs dismiss via IAuditService.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Dismiss(
        Guid snapshotId,
        [FromBody] OperatorInferredConnectionDismissApiRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (snapshotId == Guid.Empty)
        {
            return this.BadRequestProblem("SnapshotId is required.", ProblemTypes.ValidationFailed);
        }

        if (request is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string actorId = actorContext.GetActorId();

        OperatorInferredConnectionMutationResult result = await connectionService.DismissAsync(
            scope,
            snapshotId,
            new OperatorInferredConnectionDismissRequest { ConnectionId = request.ConnectionId },
            actorId,
            cancellationToken);

        if (!result.Succeeded)
        {
            if (string.Equals(result.ErrorMessage, "Inferred connection was not found.", StringComparison.Ordinal))
            {
                return this.NotFoundProblem(
                    result.ErrorMessage ?? "Inferred connection was not found.",
                    ProblemTypes.ResourceNotFound);
            }

            return this.BadRequestProblem(
                result.ErrorMessage ?? "Dismiss inferred connection failed.",
                ProblemTypes.ValidationFailed);
        }

        return NoContent();
    }

    private static OperatorInferredConnectionResponse MapResponse(OperatorInferredConnectionRecord record) =>
        new()
        {
            ConnectionId = record.ConnectionId,
            SnapshotId = record.SnapshotId,
            Status = record.Status.ToString(),
            Source = record.Source.ToString().ToLowerInvariant(),
            RuleName = record.RuleName,
            QuestionText = record.QuestionText,
            FromArmId = record.FromArmId,
            FromLabel = record.FromLabel,
            FromCloudResourceId = record.FromCloudResourceId,
            ToHost = record.ToHost,
            ToCatalog = record.ToCatalog,
            ToArmId = record.ToArmId,
            ToCloudResourceId = record.ToCloudResourceId,
            SettingName = record.SettingName,
            SourceFileFormat = record.SourceFileFormat,
            ProvenanceKind = record.Status == OperatorInferredConnectionStatus.Confirmed
                ? ProvenanceKind.HumanAssertion.ToString()
                : ProvenanceKind.DeterministicInference.ToString(),
            CreatedUtc = record.CreatedUtc,
            UpdatedUtc = record.UpdatedUtc,
        };
}
