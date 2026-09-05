using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditEvidenceSnapshotCollectionService(
    IAuditAssessmentRepository assessmentRepository,
    IAuditFrameworkRepository frameworkRepository,
    IAzureInventorySnapshotRepository inventorySnapshotRepository,
    IAuditEvidenceSelectionService selectionService,
    IAuditEvidenceSelectorRegistry selectorRegistry,
    IAuditEvidenceSnapshotRepository auditEvidenceSnapshotRepository,
    ILogger<AuditEvidenceSnapshotCollectionService> logger) : IAuditEvidenceSnapshotCollectionService
{
    public async Task<AuditAssessmentCreateResult> TryCreateAssessmentAsync(
        ScopeContext scope,
        Guid frameworkId,
        string requestedBy,
        IReadOnlyList<string> subscriptionIds,
        DateTime? periodStartUtc,
        DateTime? periodEndUtc,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(subscriptionIds);

        if (string.IsNullOrWhiteSpace(requestedBy))
        {
            return new AuditAssessmentCreateResult
            {
                Succeeded = false,
                ErrorMessage = "RequestedBy is required.",
            };
        }

        try
        {
            AuditFrameworkRecord? framework =
                await frameworkRepository.TryGetByIdAsync(scope.TenantId, frameworkId, cancellationToken);

            if (framework is null)
            {
                return new AuditAssessmentCreateResult
                {
                    Succeeded = false,
                    ErrorMessage = "Framework was not found in the current tenant.",
                };
            }

            Guid assessmentId = Guid.NewGuid();
            DateTime createdUtc = TimeProvider.System.UtcNowDateTime();

            AuditAssessmentRecord assessment = new()
            {
                AssessmentId = assessmentId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                FrameworkId = frameworkId,
                FrameworkVersion = framework.Version,
                ScopeJson = JsonSerializer.Serialize(subscriptionIds),
                PeriodStartUtc = periodStartUtc,
                PeriodEndUtc = periodEndUtc,
                Status = AuditAssessmentStatus.Draft,
                RequestedBy = requestedBy.Trim(),
                CreatedUtc = createdUtc,
            };

            await assessmentRepository.InsertAsync(assessment, cancellationToken);

            return new AuditAssessmentCreateResult
            {
                Succeeded = true,
                AssessmentId = assessmentId,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Audit assessment creation failed for FrameworkId={FrameworkId}.", frameworkId);

            return new AuditAssessmentCreateResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }

    public async Task<AuditEvidenceSnapshotCollectionResult> TryCollectSnapshotAsync(
        ScopeContext scope,
        Guid assessmentId,
        IReadOnlyList<Guid> inventorySnapshotIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(inventorySnapshotIds);

        if (inventorySnapshotIds.Count == 0)
        {
            return new AuditEvidenceSnapshotCollectionResult
            {
                Succeeded = false,
                ErrorMessage = "At least one inventory snapshot id is required.",
            };
        }

        try
        {
            AuditAssessmentRecord? assessment =
                await assessmentRepository.TryGetByIdAsync(scope.TenantId, assessmentId, cancellationToken);

            if (assessment is null)
            {
                return new AuditEvidenceSnapshotCollectionResult
                {
                    Succeeded = false,
                    ErrorMessage = "Assessment was not found in the current tenant.",
                };
            }

            AuditFrameworkRecord? framework =
                await frameworkRepository.TryGetByIdAsync(scope.TenantId, assessment.FrameworkId, cancellationToken);

            if (framework is null)
            {
                return new AuditEvidenceSnapshotCollectionResult
                {
                    Succeeded = false,
                    ErrorMessage = "Assessment framework was not found.",
                };
            }

            await assessmentRepository.UpdateStatusAsync(
                scope.TenantId,
                assessmentId,
                AuditAssessmentStatus.Collecting,
                cancellationToken);

            DateTime collectionStartedUtc = TimeProvider.System.UtcNowDateTime();
            Guid auditEvidenceSnapshotId = Guid.NewGuid();

            Dictionary<string, string> selectorVersions = selectorRegistry.ListDescriptors()
                .ToDictionary(descriptor => descriptor.CollectorId, descriptor => descriptor.Version, StringComparer.Ordinal);

            List<AuditEvidenceSnapshotItemRecord> items = [];
            Dictionary<Guid, string?> requiredFreshnessByRequirementId = [];
            List<string> failures = [];
            List<string> warnings = [];
            HashSet<string> subscriptionIds = new(StringComparer.OrdinalIgnoreCase);
            int collectedRequirementCount = 0;
            int totalRequirementCount = 0;

            foreach (Guid inventorySnapshotId in inventorySnapshotIds.Distinct())
            {
                AzureInventorySnapshotRecord? inventoryHeader =
                    await inventorySnapshotRepository.TryGetBySnapshotIdAsync(scope, inventorySnapshotId, cancellationToken);

                if (inventoryHeader is null)
                {
                    failures.Add($"Inventory snapshot {inventorySnapshotId} was not found in scope.");
                    continue;
                }

                if (!string.IsNullOrWhiteSpace(inventoryHeader.SubscriptionId))
                    subscriptionIds.Add(inventoryHeader.SubscriptionId);

                AuditEvidenceSelectionResult? selection =
                    await selectionService.TrySelectForFrameworkAsync(
                        scope,
                        inventorySnapshotId,
                        assessment.FrameworkId,
                        cancellationToken);

                if (selection is null)
                {
                    failures.Add($"Evidence selection failed for inventory snapshot {inventorySnapshotId}.");
                    continue;
                }

                string rawPointer = $"package:{inventoryHeader.PackageId}";
                string collectorVersion = inventoryHeader.CollectorVersion ?? inventoryHeader.CaptureVersion ?? "unknown";

                foreach (AuditEvidenceRequirementSelectionRecord requirementSelection in selection.Selections)
                {
                    totalRequirementCount++;
                    requiredFreshnessByRequirementId[requirementSelection.Requirement.RequirementId] =
                        requirementSelection.Requirement.RequiredFreshness;

                    if (requirementSelection.CollectionStatus != AuditEvidenceCollectionStatus.Collected)
                    {
                        items.Add(BuildGapItem(
                            auditEvidenceSnapshotId,
                            scope.TenantId,
                            requirementSelection,
                            collectionStartedUtc,
                            collectorVersion,
                            rawPointer,
                            inventorySnapshotId));

                        if (requirementSelection.CollectionStatus == AuditEvidenceCollectionStatus.Unsupported)
                            warnings.Add($"Requirement {requirementSelection.Requirement.RequirementId} is unsupported.");
                        else
                            warnings.Add($"Requirement {requirementSelection.Requirement.RequirementId} has insufficient evidence.");

                        continue;
                    }

                    collectedRequirementCount++;

                    foreach (AuditEvidenceCandidateRecord candidate in requirementSelection.Candidates)
                    {
                        string normalizedPointer =
                            $"inventory:{inventorySnapshotId}/resource:{candidate.CloudResourceId?.ToString() ?? candidate.AzureResourceId}";

                        AuditEvidenceSnapshotItemRecord builtItem = BuildCandidateItem(
                            auditEvidenceSnapshotId,
                            scope.TenantId,
                            candidate,
                            requirementSelection,
                            collectionStartedUtc,
                            collectorVersion,
                            normalizedPointer,
                            rawPointer);

                        byte[] itemHash = AuditEvidenceSnapshotHasher.ComputeItemHash(builtItem);
                        items.Add(CopyItemWithHash(builtItem, itemHash));
                    }
                }
            }

            decimal completeness = totalRequirementCount == 0
                ? 0m
                : Math.Round((decimal)collectedRequirementCount / totalRequirementCount, 4);

            DateTime collectionCompletedUtc = TimeProvider.System.UtcNowDateTime();
            items = ApplyFreshnessToItems(items, requiredFreshnessByRequirementId, collectionCompletedUtc);

            byte[] rootHash = AuditEvidenceSnapshotHasher.ComputeRootHash(items);

            AuditEvidenceSnapshotHeaderRecord header = new()
            {
                AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
                AssessmentId = assessmentId,
                TenantId = scope.TenantId,
                SubscriptionIds = subscriptionIds.ToList(),
                CollectionStartedUtc = collectionStartedUtc,
                CollectionCompletedUtc = collectionCompletedUtc,
                SelectorVersionsJson = AuditEvidenceSnapshotHasher.SerializeSelectorVersions(selectorVersions),
                FrameworkVersion = framework.Version,
                ControlCatalogVersion = Convert.ToHexString(framework.ContentHashSha256),
                Completeness = completeness,
                Failures = failures,
                Warnings = warnings,
                EvidenceHashSha256 = rootHash,
                InventorySnapshotIds = inventorySnapshotIds.Distinct().ToList(),
                CreatedUtc = collectionCompletedUtc,
            };

            await auditEvidenceSnapshotRepository.InsertSnapshotAsync(
                new AuditEvidenceSnapshotPersistRequest
                {
                    Header = header,
                    Items = items,
                },
                cancellationToken);

            await assessmentRepository.UpdateStatusAsync(
                scope.TenantId,
                assessmentId,
                AuditAssessmentStatus.Complete,
                cancellationToken);

            return new AuditEvidenceSnapshotCollectionResult
            {
                Succeeded = true,
                AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
                EvidenceHashSha256 = rootHash,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(
                ex,
                "Audit evidence snapshot collection failed for AssessmentId={AssessmentId}.",
                assessmentId);

            return new AuditEvidenceSnapshotCollectionResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }

    private static AuditEvidenceSnapshotItemRecord BuildCandidateItem(
        Guid auditEvidenceSnapshotId,
        Guid tenantId,
        AuditEvidenceCandidateRecord candidate,
        AuditEvidenceRequirementSelectionRecord requirementSelection,
        DateTime collectedUtc,
        string collectorVersion,
        string normalizedPointer,
        string rawPointer)
    {
        return new AuditEvidenceSnapshotItemRecord
        {
            EvidenceRowId = Guid.NewGuid(),
            AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
            RequirementId = candidate.RequirementId,
            TenantId = tenantId,
            CloudResourceId = candidate.CloudResourceId,
            AzureResourceId = candidate.AzureResourceId,
            EvidenceType = candidate.EvidenceType,
            CollectedUtc = collectedUtc,
            CollectorVersion = collectorVersion,
            NormalizedPointer = normalizedPointer,
            RawPointer = rawPointer,
            EvidenceHashSha256 = [],
            CollectionStatus = AuditEvidenceCollectionStatus.Collected,
            FreshnessStatus = AuditEvidenceFreshnessStatus.Unknown,
            Confidence = 1.0m,
            Summary = candidate.Summary,
            ProvenanceKind = candidate.ProvenanceKind,
            SelectorVersion = collectorVersion,
            AzureScope = requirementSelection.Requirement.RequiredAzureScopes,
            ApiQueryId = $"selector:{candidate.EvidenceType}",
        };
    }

    private static AuditEvidenceSnapshotItemRecord BuildGapItem(
        Guid auditEvidenceSnapshotId,
        Guid tenantId,
        AuditEvidenceRequirementSelectionRecord requirementSelection,
        DateTime collectedUtc,
        string collectorVersion,
        string rawPointer,
        Guid inventorySnapshotId)
    {
        string gapReason = requirementSelection.Gaps.FirstOrDefault()?.Reason ?? requirementSelection.CollectionStatus.ToString();

        AuditEvidenceSnapshotItemRecord item = new()
        {
            EvidenceRowId = Guid.NewGuid(),
            AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
            RequirementId = requirementSelection.Requirement.RequirementId,
            TenantId = tenantId,
            EvidenceType = requirementSelection.Requirement.EvidenceType,
            CollectedUtc = collectedUtc,
            CollectorVersion = collectorVersion,
            NormalizedPointer = $"inventory:{inventorySnapshotId}/gap",
            RawPointer = rawPointer,
            EvidenceHashSha256 = [],
            CollectionStatus = requirementSelection.CollectionStatus,
            FreshnessStatus = AuditEvidenceFreshnessStatus.Unknown,
            Confidence = 0m,
            Summary = gapReason,
            ProvenanceKind = ProvenanceKind.DerivedFact,
            SelectorVersion = collectorVersion,
            AzureScope = requirementSelection.Requirement.RequiredAzureScopes,
            ApiQueryId = $"selector:{requirementSelection.Requirement.EvidenceType}",
        };

        return CopyItemWithHash(item, AuditEvidenceSnapshotHasher.ComputeItemHash(item));
    }

    private static List<AuditEvidenceSnapshotItemRecord> ApplyFreshnessToItems(
        List<AuditEvidenceSnapshotItemRecord> items,
        IReadOnlyDictionary<Guid, string?> requiredFreshnessByRequirementId,
        DateTime referenceUtc)
    {
        List<AuditEvidenceSnapshotItemRecord> refreshed = [];

        foreach (AuditEvidenceSnapshotItemRecord item in items)
        {
            requiredFreshnessByRequirementId.TryGetValue(item.RequirementId, out string? requiredFreshness);
            AuditEvidenceFreshnessPolicy policy = AuditEvidenceFreshnessParser.Parse(requiredFreshness);
            AuditEvidenceFreshnessStatus freshness =
                AuditEvidenceFreshnessClassifier.Classify(item.CollectedUtc, referenceUtc, policy);

            refreshed.Add(CopyItemWithFreshness(item, freshness));
        }

        return refreshed;
    }

    private static AuditEvidenceSnapshotItemRecord CopyItemWithFreshness(
        AuditEvidenceSnapshotItemRecord source,
        AuditEvidenceFreshnessStatus freshnessStatus) =>
        new()
        {
            EvidenceRowId = source.EvidenceRowId,
            AuditEvidenceSnapshotId = source.AuditEvidenceSnapshotId,
            RequirementId = source.RequirementId,
            TenantId = source.TenantId,
            CloudResourceId = source.CloudResourceId,
            AzureResourceId = source.AzureResourceId,
            EvidenceType = source.EvidenceType,
            CollectedUtc = source.CollectedUtc,
            CollectorVersion = source.CollectorVersion,
            NormalizedPointer = source.NormalizedPointer,
            RawPointer = source.RawPointer,
            EvidenceHashSha256 = source.EvidenceHashSha256,
            CollectionStatus = source.CollectionStatus,
            FreshnessStatus = freshnessStatus,
            Confidence = source.Confidence,
            Summary = source.Summary,
            ProvenanceKind = source.ProvenanceKind,
            SelectorVersion = source.SelectorVersion,
            AzureScope = source.AzureScope,
            ApiQueryId = source.ApiQueryId,
        };

    private static AuditEvidenceSnapshotItemRecord CopyItemWithHash(
        AuditEvidenceSnapshotItemRecord source,
        byte[] evidenceHashSha256) =>
        new()
        {
            EvidenceRowId = source.EvidenceRowId,
            AuditEvidenceSnapshotId = source.AuditEvidenceSnapshotId,
            RequirementId = source.RequirementId,
            TenantId = source.TenantId,
            CloudResourceId = source.CloudResourceId,
            AzureResourceId = source.AzureResourceId,
            EvidenceType = source.EvidenceType,
            CollectedUtc = source.CollectedUtc,
            CollectorVersion = source.CollectorVersion,
            NormalizedPointer = source.NormalizedPointer,
            RawPointer = source.RawPointer,
            EvidenceHashSha256 = evidenceHashSha256,
            CollectionStatus = source.CollectionStatus,
            FreshnessStatus = source.FreshnessStatus,
            Confidence = source.Confidence,
            Summary = source.Summary,
            ProvenanceKind = source.ProvenanceKind,
            SelectorVersion = source.SelectorVersion,
            AzureScope = source.AzureScope,
            ApiQueryId = source.ApiQueryId,
        };
}
