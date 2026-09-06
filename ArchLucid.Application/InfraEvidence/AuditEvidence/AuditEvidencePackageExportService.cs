using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditEvidencePackageExportService(
    IAuditAssessmentRepository assessmentRepository,
    IAuditFrameworkRepository frameworkRepository,
    IAuditEvidenceRequirementRepository requirementRepository,
    IAuditEvidenceSnapshotRepository snapshotRepository,
    IAuditControlEvaluationRepository evaluationRepository,
    IAuditManualEvidenceRepository manualEvidenceRepository,
    IAuditEvidenceSnapshotVerificationService verificationService,
    IAuditReadinessService readinessService,
    IAuditHybridEvidenceQueryService hybridEvidenceQueryService,
    IAuditEvidenceSelectorRegistry selectorRegistry,
    ITenantBrandingProfileRepository brandingProfileRepository,
    IArtifactBlobStore blobStore,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    ILogger<AuditEvidencePackageExportService> logger) : IAuditEvidencePackageExportService
{
    public async Task<AuditEvidencePackageExportResult> TryExportAsync(
        ScopeContext scope,
        Guid assessmentId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        try
        {
            Guid tenantId = scope.TenantId;

            AuditAssessmentRecord? assessment =
                await assessmentRepository.TryGetByIdAsync(tenantId, assessmentId, cancellationToken);

            if (assessment is null)
            {
                return new AuditEvidencePackageExportResult
                {
                    Succeeded = false,
                    ErrorMessage = "Assessment not found in tenant scope.",
                };
            }

            AuditEvidenceSnapshotVerificationResult verification =
                await verificationService.TryVerifyAsync(tenantId, auditEvidenceSnapshotId, cancellationToken);

            if (!verification.IsValid)
            {
                return new AuditEvidencePackageExportResult
                {
                    Succeeded = false,
                    ErrorMessage = verification.FailureReason ?? "Snapshot verification failed.",
                };
            }

            AuditEvidenceSnapshotHeaderRecord? snapshotHeader =
                await snapshotRepository.TryGetHeaderAsync(tenantId, auditEvidenceSnapshotId, cancellationToken);

            if (snapshotHeader is null || snapshotHeader.AssessmentId != assessmentId)
            {
                return new AuditEvidencePackageExportResult
                {
                    Succeeded = false,
                    ErrorMessage = "Audit evidence snapshot not found for assessment.",
                };
            }

            AuditFrameworkRecord? framework =
                await frameworkRepository.TryGetByIdAsync(tenantId, assessment.FrameworkId, cancellationToken);

            if (framework is null)
            {
                return new AuditEvidencePackageExportResult
                {
                    Succeeded = false,
                    ErrorMessage = "Framework catalog not found.",
                };
            }

            IReadOnlyList<AuditControlRecord> controls =
                await frameworkRepository.ListControlsAsync(tenantId, assessment.FrameworkId, cancellationToken);

            IReadOnlyList<AuditEvidenceRequirementRecord> requirements =
                await requirementRepository.ListByFrameworkIdAsync(tenantId, assessment.FrameworkId, cancellationToken);

            IReadOnlyList<AuditEvidenceSnapshotItemRecord> snapshotItems =
                await snapshotRepository.ListItemsAsync(tenantId, auditEvidenceSnapshotId, cancellationToken);

            IReadOnlyList<AuditManualEvidenceSubmissionRecord> manualSubmissions =
                await manualEvidenceRepository.ListByAssessmentAsync(tenantId, assessmentId, cancellationToken);

            IReadOnlyList<AuditArchitectureEvidenceLinkRecord> architectureLinks =
                await manualEvidenceRepository.ListArchitectureLinksByAssessmentAsync(
                    tenantId,
                    assessmentId,
                    cancellationToken);

            if (architectureLinks.Count > 0)
            {
                await AuditArchitectureEvidenceSealedManifestHashGuard.EnsureLinkedRunsSealedManifestHashOrThrowAsync(
                    architectureLinks,
                    scope,
                    authorityQueryService,
                    manifestHashService,
                    cancellationToken);
            }

            AuditAssessmentReadinessSummaryRecord? readinessSummary =
                await readinessService.TryBuildAssessmentReadinessAsync(
                    tenantId,
                    assessmentId,
                    auditEvidenceSnapshotId,
                    cancellationToken: cancellationToken);

            if (readinessSummary is null)
            {
                return new AuditEvidencePackageExportResult
                {
                    Succeeded = false,
                    ErrorMessage = "Audit readiness summary could not be built.",
                };
            }

            Dictionary<Guid, AuditControlEvaluationRecord> evaluationsByControlId = [];

            foreach (AuditControlRecord control in controls)
            {
                AuditControlEvaluationRecord? evaluation =
                    await evaluationRepository.TryGetLatestByControlAsync(
                        tenantId,
                        control.ControlId,
                        auditEvidenceSnapshotId,
                        cancellationToken);

                if (evaluation is not null)
                    evaluationsByControlId[control.ControlId] = evaluation;
            }

            Dictionary<Guid, AuditHybridControlEvidenceRecord> hybridByControlId = [];

            foreach (AuditControlRecord control in controls)
            {
                AuditHybridControlEvidenceRecord? hybrid =
                    await hybridEvidenceQueryService.TryGetControlEvidenceSourcesAsync(
                        scope,
                        assessmentId,
                        control.ControlId,
                        auditEvidenceSnapshotId,
                        cancellationToken);

                if (hybrid is not null)
                    hybridByControlId[control.ControlId] = hybrid;
            }

            TenantBrandingProfileRecord? branding =
                await brandingProfileRepository.TryGetActiveAsync(tenantId, cancellationToken)
                ?? await brandingProfileRepository.TryGetDefaultAsync(tenantId, cancellationToken);

            Dictionary<string, string?> manualBlobContent = [];

            foreach (AuditManualEvidenceSubmissionRecord submission in manualSubmissions)
            {
                if (manualBlobContent.ContainsKey(submission.BlobPointer))
                    continue;

                string? content = await blobStore.ReadAsync(submission.BlobPointer, cancellationToken);
                manualBlobContent[submission.BlobPointer] = content;
            }

            string rootFolder = $"ARC-AMPE-{assessmentId:N}";

            AuditEvidencePackageProjectionContext projectionContext = new()
            {
                Assessment = assessment,
                Framework = framework,
                SnapshotHeader = snapshotHeader,
                Controls = controls,
                Requirements = requirements,
                SnapshotItems = snapshotItems,
                EvaluationsByControlId = evaluationsByControlId,
                ManualSubmissions = manualSubmissions,
                ArchitectureLinks = architectureLinks,
                ReadinessSummary = readinessSummary,
                HybridByControlId = hybridByControlId,
                SelectorDescriptors = selectorRegistry.ListDescriptors(),
                BrandingDisplayName = branding?.CompanyDisplayName,
                ManualBlobContentByPointer = manualBlobContent,
            };

            IReadOnlyList<AuditEvidencePackageEntry> entries =
                AuditEvidencePackageProjectionBuilder.BuildEntries(projectionContext);

            AuditEvidencePackageCollectionManifest manifest = new()
            {
                RootFolder = rootFolder,
                AssessmentId = assessmentId,
                AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
                FrameworkId = framework.FrameworkId,
                FrameworkVersion = snapshotHeader.FrameworkVersion,
                ControlCatalogVersion = snapshotHeader.ControlCatalogVersion,
                SelectorVersionsJson = snapshotHeader.SelectorVersionsJson,
                InventorySnapshotIds = snapshotHeader.InventorySnapshotIds,
                SnapshotRootHashSha256 = Convert.ToHexString(snapshotHeader.EvidenceHashSha256),
                ExportedUtc = TimeProvider.System.UtcNowDateTime(),
            };

            (byte[] zipBytes, string evidenceHashesJson) =
                AuditEvidencePackageZipBuilder.BuildZip(entries, manifest);

            return new AuditEvidencePackageExportResult
            {
                Succeeded = true,
                ZipContent = zipBytes,
                PackageFileName = $"arc-ampe-evidence-{assessmentId:N}-{auditEvidenceSnapshotId:N}.zip",
                EvidenceHashesJson = evidenceHashesJson,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException and not ConflictException)
        {
            logger.LogWarning(
                ex,
                "Audit evidence package export failed for AssessmentId={AssessmentId} SnapshotId={SnapshotId}.",
                assessmentId,
                auditEvidenceSnapshotId);

            return new AuditEvidencePackageExportResult
            {
                Succeeded = false,
                ErrorMessage = "Audit evidence package export failed.",
            };
        }
    }
}
