using System.Text.Json;

using ArchLucid.Application;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Governance;

/// <summary>Default <see cref="IGovernanceMutationCorrectionService"/> — append-only audit corrections (LI-05).</summary>
public sealed class GovernanceMutationCorrectionService(
    IGovernanceApprovalRequestRepository approvalRepo,
    IGovernancePromotionRecordRepository promotionRepo,
    IGovernanceEnvironmentActivationRepository activationRepo,
    IFindingReviewTrailRepository findingReviewTrailRepository,
    IFindingInspectReadRepository findingInspectReadRepository,
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    IAuditService auditService,
    ILogger<GovernanceMutationCorrectionService> logger) : IGovernanceMutationCorrectionService
{
    private readonly IGovernanceApprovalRequestRepository _approvalRepo =
        approvalRepo ?? throw new ArgumentNullException(nameof(approvalRepo));

    private readonly IGovernancePromotionRecordRepository _promotionRepo =
        promotionRepo ?? throw new ArgumentNullException(nameof(promotionRepo));

    private readonly IGovernanceEnvironmentActivationRepository _activationRepo =
        activationRepo ?? throw new ArgumentNullException(nameof(activationRepo));

    private readonly IFindingReviewTrailRepository _findingReviewTrailRepository =
        findingReviewTrailRepository ?? throw new ArgumentNullException(nameof(findingReviewTrailRepository));

    private readonly IFindingInspectReadRepository _findingInspectReadRepository =
        findingInspectReadRepository ?? throw new ArgumentNullException(nameof(findingInspectReadRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ILogger<GovernanceMutationCorrectionService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<GovernanceMutationCorrectionRecordedDto> RecordAsync(
        RecordGovernanceMutationCorrectionRequest request,
        ScopeContext scope,
        string actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(actorUserId))
            throw new ArgumentException("Actor user id is required.", nameof(actorUserId));

        string mutationKind = request.MutationKind?.Trim() ?? string.Empty;

        if (!GovernanceMutationCorrectionKinds.IsSupported(mutationKind))
            throw new ArgumentException($"Mutation kind '{mutationKind}' does not support in-product correction.", nameof(request));

        string subjectId = request.SubjectId?.Trim() ?? string.Empty;

        if (subjectId.Length == 0)
            throw new ArgumentException("Subject id is required.", nameof(request));

        if (subjectId.Length > FindingDispositionValidation.MaxFindingIdLength)
        {
            throw new ArgumentException(
                $"Subject id must not exceed {FindingDispositionValidation.MaxFindingIdLength} characters.",
                nameof(request));
        }

        string rationale = request.Rationale?.Trim() ?? string.Empty;

        if (rationale.Length == 0)
            throw new ArgumentException("Rationale is required to record a correction.", nameof(request));

        if (rationale.Length < FindingDispositionValidation.MinimumRationaleLength)
        {
            throw new ArgumentException(
                $"Rationale must be at least {FindingDispositionValidation.MinimumRationaleLength} characters.",
                nameof(request));
        }

        if (rationale.Length > FindingDispositionValidation.MaximumRationaleLength)
        {
            throw new ArgumentException(
                $"Rationale must not exceed {FindingDispositionValidation.MaximumRationaleLength} characters.",
                nameof(request));
        }

        string normalizedRunId = await GovernanceRunScope.RequireScopedRunIdAsync(
            _scopeContextProvider,
            _runRepository,
            request.RunId,
            cancellationToken);

        if (Guid.TryParse(normalizedRunId, out Guid scopedRunGuid))
        {
            ScopeContext scopeForManifest = scope;
            RunDetailDto? runDetail =
                await _authorityQueryService.GetRunDetailForManifestCompareAsync(scopeForManifest, scopedRunGuid, cancellationToken);

            if (runDetail?.GoldenManifest is null)
            {
                throw new ConflictException(
                    $"Governance mutation correction blocked for run '{normalizedRunId}': committed golden manifest is missing.");
            }

            ManifestDecisionReceiptExportBinder.EnsureSealedManifestHashMatchesOrThrow(
                runDetail.GoldenManifest,
                normalizedRunId,
                _manifestHashService);
        }

        subjectId = await ValidateSubjectAsync(mutationKind, subjectId, normalizedRunId, scope, cancellationToken);

        Guid correctionId = Guid.NewGuid();
        DateTimeOffset recordedAtUtc = TimeProvider.System.GetUtcNow();
        string actor = actorUserId.Trim();
        Guid? auditRunId = Guid.TryParse(normalizedRunId, out Guid parsedRunGuid) ? parsedRunGuid : null;

        AuditEvent auditEvent = scope.CreateAuditEvent(
            AuditEventTypes.GovernanceMutationCorrectionRecorded,
            actor,
            actor,
            JsonSerializer.Serialize(
                new
                {
                    correctionId,
                    mutationKind,
                    subjectId,
                    runId = normalizedRunId,
                    rationale,
                    recordedAtUtc = recordedAtUtc.UtcDateTime,
                    recordedByUserId = actor,
                },
                AuditJsonSerializationOptions.Instance));
        auditEvent.RunId = auditRunId;

        await DurableAuditLogRetry.LogOrThrowAsync(
            ct => _auditService.LogAsync(auditEvent, ct),
            _logger,
            $"GovernanceMutationCorrection:{correctionId:N}",
            cancellationToken,
            auditEventTypeForMetrics: auditEvent.EventType);

        return new GovernanceMutationCorrectionRecordedDto
        {
            CorrectionId = correctionId.ToString("D"),
            MutationKind = mutationKind,
            SubjectId = subjectId,
            RunId = normalizedRunId,
            Rationale = rationale,
            RecordedAtUtc = recordedAtUtc,
            RecordedByUserId = actor,
        };
    }

    private async Task<string> ValidateSubjectAsync(
        string mutationKind,
        string subjectId,
        string normalizedRunId,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (mutationKind is GovernanceMutationCorrectionKinds.QuickApprove
            or GovernanceMutationCorrectionKinds.WorkflowApprove
            or GovernanceMutationCorrectionKinds.WorkflowReject)
        {
            await ValidateApprovalSubjectAsync(mutationKind, subjectId, normalizedRunId, cancellationToken);

            return subjectId;
        }

        if (mutationKind == GovernanceMutationCorrectionKinds.WorkflowPromote)
        {
            await ValidatePromotionSubjectAsync(subjectId, normalizedRunId, cancellationToken);

            return subjectId;
        }

        if (mutationKind == GovernanceMutationCorrectionKinds.WorkflowActivate)
        {
            await ValidateActivationSubjectAsync(subjectId, normalizedRunId, cancellationToken);

            return subjectId;
        }

        if (mutationKind is GovernanceMutationCorrectionKinds.BulkDisposition
            or GovernanceMutationCorrectionKinds.KeyboardFindingDisposition)
        {
            return await ValidateFindingDispositionSubjectAsync(subjectId, normalizedRunId, scope, cancellationToken);
        }

        if (mutationKind == GovernanceMutationCorrectionKinds.ArchitectureReviewFinalize)
        {
            return ValidateArchitectureReviewFinalizeSubject(subjectId, normalizedRunId);
        }

        throw new ArgumentException($"Mutation kind '{mutationKind}' does not support in-product correction.", nameof(mutationKind));
    }

    private async Task<string> ValidateFindingDispositionSubjectAsync(
        string findingId,
        string normalizedRunId,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (scope.TenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(scope));

        FindingInspectResponse? finding = await _findingInspectReadRepository.GetInspectAsync(
            scope,
            findingId.Trim(),
            cancellationToken,
            FindingInspectReadOptions.MetadataOnly);

        if (finding is null)
            throw new KeyNotFoundException($"Finding '{findingId}' has no recorded disposition to correct.");

        string canonicalFindingId = finding.FindingId;

        IReadOnlyList<FindingReviewEventRecord> events =
            await _findingReviewTrailRepository.ListByFindingAsync(scope.TenantId, canonicalFindingId, cancellationToken);

        Guid? normalizedRunGuid = Guid.TryParse(normalizedRunId, out Guid parsedRunId) ? parsedRunId : null;

        bool hasDispositionForRun = events.Any(reviewEvent =>
            reviewEvent.WorkspaceId == scope.WorkspaceId
            && reviewEvent.ProjectId == scope.ProjectId
            && reviewEvent.Action == FindingReviewAction.RecordDisposition
            && reviewEvent.Disposition is not null
            && reviewEvent.RunId == normalizedRunGuid);

        if (!hasDispositionForRun)
            throw new KeyNotFoundException($"Finding '{findingId}' has no recorded disposition to correct.");

        return canonicalFindingId;
    }

    private async Task ValidateApprovalSubjectAsync(
        string mutationKind,
        string approvalRequestId,
        string normalizedRunId,
        CancellationToken cancellationToken)
    {
        GovernanceApprovalRequest? approval = await _approvalRepo.GetByIdAsync(approvalRequestId, cancellationToken);

        if (approval is null)
            throw new KeyNotFoundException($"Approval request '{approvalRequestId}' was not found.");

        if (!string.Equals(approval.RunId, normalizedRunId, StringComparison.OrdinalIgnoreCase))
            throw new KeyNotFoundException($"Approval request '{approvalRequestId}' was not found.");

        if (mutationKind is GovernanceMutationCorrectionKinds.QuickApprove
            or GovernanceMutationCorrectionKinds.WorkflowApprove)
        {
            if (!string.Equals(approval.Status, GovernanceApprovalStatus.Approved, StringComparison.Ordinal))
                throw new ConflictException("Corrections can only be recorded after the approval request is approved.");
        }
        else if (!string.Equals(approval.Status, GovernanceApprovalStatus.Rejected, StringComparison.Ordinal))
        {
            throw new ConflictException("Corrections can only be recorded after the approval request is rejected.");
        }
    }

    private async Task ValidatePromotionSubjectAsync(
        string promotionRecordId,
        string normalizedRunId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<GovernancePromotionRecord> promotions =
            await _promotionRepo.GetByRunIdAsync(normalizedRunId, cancellationToken);

        bool found = promotions.Any(p =>
            string.Equals(p.PromotionRecordId, promotionRecordId, StringComparison.OrdinalIgnoreCase));

        if (!found)
            throw new KeyNotFoundException($"Promotion record '{promotionRecordId}' was not found.");
    }

    private static string ValidateArchitectureReviewFinalizeSubject(string subjectId, string normalizedRunId)
    {
        if (!string.Equals(subjectId.Trim(), normalizedRunId, StringComparison.OrdinalIgnoreCase))
        {
            throw new KeyNotFoundException(
                $"Architecture review finalize correction subject '{subjectId}' does not match run '{normalizedRunId}'.");
        }

        return normalizedRunId;
    }

    private async Task ValidateActivationSubjectAsync(
        string activationId,
        string normalizedRunId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<GovernanceEnvironmentActivation> activations =
            await _activationRepo.GetByRunIdAsync(normalizedRunId, cancellationToken);

        GovernanceEnvironmentActivation? activation = activations.FirstOrDefault(a =>
            string.Equals(a.ActivationId, activationId, StringComparison.OrdinalIgnoreCase));

        if (activation is null)
            throw new KeyNotFoundException($"Environment activation '{activationId}' was not found.");

        if (!activation.IsActive)
        {
            throw new ConflictException(
                "Corrections can only be recorded for the active environment activation.");
        }
    }
}
