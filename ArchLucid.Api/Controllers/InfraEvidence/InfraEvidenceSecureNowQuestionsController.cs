using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
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
[Route("v{version:apiVersion}/infra-evidence/snapshots/{snapshotId:guid}/questions")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class InfraEvidenceSecureNowQuestionsController(
    ISecureNowQuestionDispositionService dispositionService,
    IScopeContextProvider scopeProvider,
    IActorContext actorContext) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<SecureNowQuestionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(Guid snapshotId, CancellationToken cancellationToken = default)
    {
        if (snapshotId == Guid.Empty)
            return this.BadRequestProblem("SnapshotId is required.", ProblemTypes.ValidationFailed);

        IReadOnlyList<SecureNowQuestionRecord> questions =
            await dispositionService.ListQuestionsAsync(
                scopeProvider.GetCurrentScope(),
                snapshotId,
                cancellationToken);
        return Ok(questions.Select(MapQuestion).ToList());
    }

    [HttpPost("answer")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: SecureNowQuestionDispositionService logs answer via IAuditService.")]
    public async Task<IActionResult> Answer(
        Guid snapshotId,
        [FromBody] SecureNowQuestionDispositionWriteApiRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (snapshotId == Guid.Empty)
            return this.BadRequestProblem("SnapshotId is required.", ProblemTypes.ValidationFailed);
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        if (!TryMapWriteRequest(request, out SecureNowQuestionDispositionWriteRequest? mapped, out string? error))
            return this.BadRequestProblem(error!, ProblemTypes.ValidationFailed);

        SecureNowQuestionDispositionMutationResult result = await dispositionService.AnswerAsync(
            scopeProvider.GetCurrentScope(),
            snapshotId,
            mapped!,
            actorContext.GetActorId(),
            cancellationToken);
        return MutationResult(result);
    }

    [HttpPost("ignore")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: SecureNowQuestionDispositionService logs ignore via IAuditService.")]
    public async Task<IActionResult> Ignore(
        Guid snapshotId,
        [FromBody] SecureNowQuestionDispositionWriteApiRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (snapshotId == Guid.Empty)
            return this.BadRequestProblem("SnapshotId is required.", ProblemTypes.ValidationFailed);
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);
        if (!TryMapWriteRequest(request, out SecureNowQuestionDispositionWriteRequest? mapped, out string? error))
            return this.BadRequestProblem(error!, ProblemTypes.ValidationFailed);

        SecureNowQuestionDispositionMutationResult result = await dispositionService.IgnoreAsync(
            scopeProvider.GetCurrentScope(),
            snapshotId,
            mapped!,
            actorContext.GetActorId(),
            cancellationToken);
        return MutationResult(result);
    }

    [HttpPost("reopen")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: SecureNowQuestionDispositionService logs reopen via IAuditService.")]
    public async Task<IActionResult> Reopen(
        Guid snapshotId,
        [FromBody] SecureNowQuestionDispositionReopenApiRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (snapshotId == Guid.Empty)
            return this.BadRequestProblem("SnapshotId is required.", ProblemTypes.ValidationFailed);
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        SecureNowQuestionDispositionMutationResult result = await dispositionService.ReopenAsync(
            scopeProvider.GetCurrentScope(),
            snapshotId,
            new SecureNowQuestionDispositionReopenRequest
            {
                SubscriptionId = request.SubscriptionId,
                ResourceId = request.ResourceId,
                QuestionKey = request.QuestionKey,
                Reason = request.Reason,
            },
            actorContext.GetActorId(),
            cancellationToken);
        return MutationResult(result);
    }

    private IActionResult MutationResult(SecureNowQuestionDispositionMutationResult result)
    {
        if (result.Succeeded)
            return Ok(result.Record is null ? null : Map(result.Record));
        if (string.Equals(result.ErrorMessage, "Snapshot was not found.", StringComparison.Ordinal)
            || string.Equals(result.ErrorMessage, "Question disposition was not found.", StringComparison.Ordinal))
            return this.NotFoundProblem(result.ErrorMessage!, ProblemTypes.ResourceNotFound);
        return this.BadRequestProblem(result.ErrorMessage ?? "Question disposition mutation failed.", ProblemTypes.ValidationFailed);
    }

    private static bool TryMapWriteRequest(
        SecureNowQuestionDispositionWriteApiRequest request,
        out SecureNowQuestionDispositionWriteRequest? mapped,
        out string? error)
    {
        mapped = null;
        error = null;
        if (!Enum.TryParse(request.Source, true, out SecureNowQuestionSource source))
        {
            error = "Source is invalid.";
            return false;
        }
        if (!Enum.TryParse(request.ScopeKind, true, out SecureNowQuestionScopeKind scopeKind))
        {
            error = "ScopeKind is invalid.";
            return false;
        }

        mapped = new SecureNowQuestionDispositionWriteRequest
        {
            SubscriptionId = request.SubscriptionId,
            ResourceId = request.ResourceId,
            QuestionKey = request.QuestionKey,
            Source = source,
            ScopeKind = scopeKind,
            AnswerCode = request.AnswerCode,
            AnswerText = request.AnswerText,
            Reason = request.Reason,
            ExpirationUtc = request.ExpirationUtc,
            EvidenceFingerprint = request.EvidenceFingerprint,
        };
        return true;
    }

    private static SecureNowQuestionDispositionResponse Map(SecureNowQuestionDispositionRecord record) =>
        new()
        {
            DispositionId = record.DispositionId,
            SnapshotId = record.SnapshotId,
            SubscriptionId = record.SubscriptionId,
            ResourceId = record.ResourceId,
            QuestionKey = record.QuestionKey,
            Source = record.Source.ToString(),
            ScopeKind = record.ScopeKind.ToString(),
            Status = record.Status.ToString(),
            AnswerCode = record.AnswerCode,
            AnswerText = record.AnswerText,
            Reason = record.Reason,
            ExpirationUtc = record.ExpirationUtc,
            IsExpired = record.IsExpired,
            EvidenceFingerprint = record.EvidenceFingerprint,
            ActorKey = record.ActorKey,
            UpdatedUtc = record.UpdatedUtc,
            AuditEntries = record.AuditEntries
                .Select(entry => new SecureNowQuestionDispositionAuditResponse
                {
                    Action = entry.Action,
                    ActorKey = entry.ActorKey,
                    OccurredUtc = entry.OccurredUtc,
                    Reason = entry.Reason,
                })
                .ToList(),
        };

    private static SecureNowQuestionResponse MapQuestion(SecureNowQuestionRecord question) =>
        new()
        {
            DispositionId = question.DispositionId,
            SnapshotId = question.SnapshotId,
            SubscriptionId = question.SubscriptionId,
            ResourceId = question.ResourceId,
            QuestionKey = question.QuestionKey,
            Source = question.Source.ToString(),
            ScopeKind = question.ScopeKind.ToString(),
            Status = question.Status.ToString(),
            QuestionText = question.QuestionText,
            SourceLine = question.SourceLine,
            AnswerCodes = question.AnswerCodes,
            EvidenceFingerprint = question.EvidenceFingerprint,
            ExpirationUtc = question.ExpirationUtc,
            IsExpired = question.IsExpired,
            AnswerCode = question.AnswerCode,
            AnswerText = question.AnswerText,
            Reason = question.Reason,
        };
}
