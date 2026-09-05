using ArchLucid.Application.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditManualEvidenceSubmissionService(
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditManualEvidenceRepository manualEvidenceRepository,
    IAuditEvidenceRequirementRepository requirementRepository,
    IAuditAssessmentRepository assessmentRepository,
    IArtifactBlobStore blobStore,
    ILogger<AuditManualEvidenceSubmissionService> logger) : IAuditManualEvidenceSubmissionService
{
    public async Task<AuditManualEvidenceSubmitResult> TrySubmitAsync(
        AuditManualEvidenceSubmitRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        try
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            string actorId = actorContext.GetActorId();
            string submittedBy = actorContext.TryGetSubmitterMailbox() ?? actorContext.GetActor();

            AuditManualEvidenceActorGuard.EnsureHumanSubmitter(actorId, ProvenanceKind.HumanAssertion);

            AuditAssessmentRecord? assessment =
                await assessmentRepository.TryGetByIdAsync(scope.TenantId, request.AssessmentId, cancellationToken);

            if (assessment is null)
            {
                return new AuditManualEvidenceSubmitResult
                {
                    Succeeded = false,
                    ErrorMessage = "Assessment not found in current tenant scope.",
                };
            }

            IReadOnlyList<AuditEvidenceRequirementRecord> requirements =
                await requirementRepository.ListByControlIdAsync(
                    scope.TenantId,
                    request.ControlId,
                    cancellationToken);

            AuditEvidenceRequirementRecord? requirement = requirements
                .FirstOrDefault(candidate => candidate.RequirementId == request.RequirementId);

            if (requirement is null || !requirement.ManualEvidenceAllowed)
            {
                return new AuditManualEvidenceSubmitResult
                {
                    Succeeded = false,
                    ErrorMessage = "Requirement does not allow manual evidence for this control.",
                };
            }

            if (string.IsNullOrWhiteSpace(request.Content))
            {
                return new AuditManualEvidenceSubmitResult
                {
                    Succeeded = false,
                    ErrorMessage = "Evidence content is required.",
                };
            }

            Guid submissionId = Guid.NewGuid();
            byte[] evidenceHash = AuditManualEvidenceHasher.ComputeContentHash(request.Content);
            string blobName = $"audit-manual/{request.AssessmentId:N}/{submissionId:N}.txt";
            string blobPointer = await blobStore.WriteAsync(
                "artifacts",
                blobName,
                request.Content,
                cancellationToken);

            AuditManualEvidenceSubmissionRecord submission = new()
            {
                SubmissionId = submissionId,
                TenantId = scope.TenantId,
                AssessmentId = request.AssessmentId,
                ControlId = request.ControlId,
                RequirementId = request.RequirementId,
                Owner = request.Owner,
                SubmittedBy = submittedBy,
                SubmittedUtc = TimeProvider.System.UtcNowDateTime(),
                ApplicablePeriodStartUtc = request.ApplicablePeriodStartUtc,
                ApplicablePeriodEndUtc = request.ApplicablePeriodEndUtc,
                ExpirationUtc = request.ExpirationUtc,
                DocumentVersion = request.DocumentVersion,
                DocumentKind = request.DocumentKind,
                EvidenceHashSha256 = evidenceHash,
                BlobPointer = blobPointer,
                ReviewStatus = AuditEvidenceReviewStatus.Pending,
                ProvenanceKind = ProvenanceKind.HumanAssertion,
                ItsmProvider = request.ItsmProvider,
                ItsmExternalKey = request.ItsmExternalKey,
            };

            await manualEvidenceRepository.InsertSubmissionAsync(submission, cancellationToken);

            return new AuditManualEvidenceSubmitResult
            {
                Succeeded = true,
                SubmissionId = submissionId,
            };
        }
        catch (InvalidOperationException ex)
        {
            return new AuditManualEvidenceSubmitResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Manual audit evidence submission failed for RequirementId={RequirementId}.", request.RequirementId);

            return new AuditManualEvidenceSubmitResult
            {
                Succeeded = false,
                ErrorMessage = "Manual evidence submission failed.",
            };
        }
    }
}
