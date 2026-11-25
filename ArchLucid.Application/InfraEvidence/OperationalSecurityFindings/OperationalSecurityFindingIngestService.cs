using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;

public sealed class OperationalSecurityFindingIngestService(
    IOperationalSecurityFindingRepository repository,
    IAuditService auditService,
    ILogger<OperationalSecurityFindingIngestService> logger,
    ISecurityCrosswalkService? crosswalk = null) : IOperationalSecurityFindingIngestService
{
    public async Task<OperationalSecurityFindingBatchIngestResult> IngestBatchAsync(
        ScopeContext scope,
        IReadOnlyList<OperationalSecurityFindingIngestItem> items,
        string actorId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(items);

        if (string.IsNullOrWhiteSpace(actorId))
            throw new ArgumentException("ActorId is required.", nameof(actorId));

        List<OperationalSecurityFindingIngestItemResult> results = [];
        int ingestedCount = 0;
        int deduplicatedCount = 0;
        int failedCount = 0;

        for (int index = 0; index < items.Count; index++)
        {
            OperationalSecurityFindingIngestItem item = items[index];

            if (item is null)
            {
                results.Add(new OperationalSecurityFindingIngestItemResult
                {
                    Index = index,
                    Succeeded = false,
                    ErrorMessage = "Null item in batch.",
                });
                failedCount++;
                continue;
            }

            OperationalSecurityFindingIngestItemResult itemResult =
                await IngestSingleAsync(scope, item, actorId, index, cancellationToken);

            results.Add(itemResult);

            if (!itemResult.Succeeded)
            {
                failedCount++;
                continue;
            }

            if (itemResult.WasDeduplicated)
                deduplicatedCount++;
            else
                ingestedCount++;
        }

        return new OperationalSecurityFindingBatchIngestResult
        {
            Items = results,
            IngestedCount = ingestedCount,
            DeduplicatedCount = deduplicatedCount,
            FailedCount = failedCount,
        };
    }

    public async Task<OperationalSecurityFindingDetailResult> TryGetDetailAsync(
        ScopeContext scope,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (findingId == Guid.Empty)
        {
            return new OperationalSecurityFindingDetailResult
            {
                Succeeded = false,
                ErrorMessage = "FindingId is required.",
            };
        }

        OperationalSecurityFindingRecord? finding =
            await repository.TryGetByIdInScopeAsync(
                scope.ToProjectScopeKey(),
                findingId,
                cancellationToken);

        if (finding is null)
        {
            return new OperationalSecurityFindingDetailResult
            {
                Succeeded = false,
                ErrorMessage = "Operational security finding was not found in current tenant scope.",
            };
        }

        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata =
            await repository.ListMetadataByFindingAsync(scope.TenantId, findingId, cancellationToken);

        IReadOnlyList<OperationalSecurityFindingObservationRecord> observations =
            await repository.ListObservationsByFindingAsync(scope.TenantId, findingId, cancellationToken);

        return new OperationalSecurityFindingDetailResult
        {
            Succeeded = true,
            Finding = finding,
            Metadata = metadata,
            Observations = observations,
        };
    }

    private async Task<OperationalSecurityFindingIngestItemResult> IngestSingleAsync(
        ScopeContext scope,
        OperationalSecurityFindingIngestItem item,
        string actorId,
        int index,
        CancellationToken cancellationToken)
    {
        if (!OperationalSecurityFindingGuard.TryValidateIngestItem(item, out string? validationError))
        {
            return new OperationalSecurityFindingIngestItemResult
            {
                Index = index,
                Succeeded = false,
                ErrorMessage = validationError,
            };
        }

        KeyValuePair<string, string?>[] advisoryEntries = item.Metadata
            .Where(entry => AdvisoryRemediationEvidence.IsMetadataKey(entry.Key))
            .ToArray();
        AdvisoryRemediationEvidence? advisory = advisoryEntries.Length == 1
            ? AdvisoryRemediationEvidence.Parse(advisoryEntries[0].Value)
            : null;
        if ((advisoryEntries.Length != 0 && (advisory is null
                || !string.Equals(advisoryEntries[0].Key, AdvisoryRemediationEvidence.MetadataKey, StringComparison.Ordinal)))
            || !Enum.IsDefined(item.Status)
            || item.Status == OperationalSecurityFindingStatus.Informational
            || (advisory is not null && item.Status != OperationalSecurityFindingStatus.Open)
            || (advisory?.Owner is AdvisoryRemediationOwner.Customer or AdvisoryRemediationOwner.Shared
                && (item.CloudResourceId is null || item.CloudResourceId == Guid.Empty)))
        {
            return Rejected(index, "Invalid advisory evidence, deployment scope, or requested status.");
        }

        if (AdvisoryAliasInput.UsesReservedIdentity(item))
            return Rejected(index, "Canonical advisory identity and provenance fields are system-managed.");

        KeyValuePair<string, string?>[] aliasEntries = item.Metadata
            .Where(entry => string.Equals(entry.Key.Trim(), AdvisoryAliasInput.MetadataKey, StringComparison.OrdinalIgnoreCase))
            .ToArray();
        AdvisoryAliasInput? alias = aliasEntries.Length == 1 ? AdvisoryAliasInput.Parse(aliasEntries[0].Value) : null;
        if (aliasEntries.Length != 0
            && (alias is null || advisory is null || item.ObservedUtc is not { Kind: DateTimeKind.Utc }
                || item.CloudResourceId == Guid.Empty
                || !string.Equals(aliasEntries[0].Key, AdvisoryAliasInput.MetadataKey, StringComparison.Ordinal)
                || !string.IsNullOrWhiteSpace(item.ControlId) || !string.IsNullOrWhiteSpace(item.ControlFramework)))
            return Rejected(index, "Canonical advisories need scoped evidence, an explicit UTC revision time, and no submitted control identifier.");

        OperationalSecurityFindingStatus incomingStatus = advisory?.IsInformational == true
            ? OperationalSecurityFindingStatus.Informational
            : item.Status;

        try
        {
            DateTime observedUtc = item.ObservedUtc ?? TimeProvider.System.UtcNowDateTime();
            KeyValuePair<string, string?> provenance = default;
            string authority = item.SourceSystem.Trim().ToUpperInvariant();
            if (alias is not null && advisory is not null)
            {
                provenance = alias.CreateProvenance(item, advisory, actorId);
                string canonicalEvidence = alias.CanonicalEvidence(advisory);
                if (provenance.Value is not { Length: <= 1024 } || canonicalEvidence.Length > 1024)
                    return Rejected(index, "Canonical advisory evidence or provenance exceeds the metadata size limit.");

                // Do not mint a control from a CVE, a URL or a scanner's suggested ID.
                string? mappedControl = alias.ReferenceOnly
                    ? null
                    : await ResolveAdvisoryControlAsync(scope.TenantId, alias, cancellationToken);
                item = item with
                {
                    SourceSystem = AdvisoryAliasInput.CanonicalSource,
                    SourceFindingId = alias.FindingKey(item.CloudResourceId),
                    ControlId = mappedControl,
                    Metadata = new Dictionary<string, string?>
                    {
                        [AdvisoryRemediationEvidence.MetadataKey] = canonicalEvidence,
                        [AdvisoryAliasInput.AuthorityKey] = authority,
                        [provenance.Key] = provenance.Value,
                    },
                };
                advisory = advisory with { AdvisoryId = alias.CveId };
            }

            OperationalSecurityFindingRecord? existing = await repository.TryGetByNaturalKeyInScopeAsync(
                scope.ToProjectScopeKey(),
                item.Provider,
                item.SourceSystem.Trim(),
                item.SourceFindingId.Trim(),
                cancellationToken);

            // Hash the effective revision. Omitted fields retain their stored values;
            // a canonical control mapping, by contrast, is replaced even when it resolves to null.
            if (alias is not null && existing is not null)
            {
                item = item with
                {
                    Severity = item.Severity ?? existing.Severity,
                    RiskScore = item.RiskScore ?? existing.RiskScore,
                    Exploitability = item.Exploitability ?? existing.Exploitability,
                    Exposure = item.Exposure ?? existing.Exposure,
                    BusinessCriticality = item.BusinessCriticality ?? existing.BusinessCriticality,
                    BlastRadius = item.BlastRadius ?? existing.BlastRadius,
                    PathId = item.PathId ?? existing.PathId,
                };
            }

            byte[] payloadHash = alias is not null && advisory is not null
                ? alias.MaterialHash(item, advisory)
                : OperationalSecurityFindingGuard.ComputePayloadHash(item);

            if (existing is null)
            {
                if (alias?.ReferenceOnly == true)
                    return Rejected(index, "A reference cannot create the canonical advisory. Submit publisher guidance first.");
                Guid findingId = Guid.NewGuid();
                OperationalSecurityFindingRecord finding = BuildFindingRecord(
                    findingId,
                    scope,
                    item,
                    observedUtc,
                    observedUtc,
                    incomingStatus,
                    payloadHash,
                    observedUtc);

                OperationalSecurityFindingObservationRecord observation = BuildObservation(
                    findingId,
                    scope.TenantId,
                    item,
                    observedUtc,
                    incomingStatus,
                    payloadHash);

                IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata =
                    BuildMetadata(findingId, scope.TenantId, item.Metadata);

                await repository.InsertAsync(finding, metadata, observation, cancellationToken);

                await LogAuditAsync(
                    scope,
                    actorId,
                    AuditEventTypes.OperationalSecurityFindingIngested,
                    findingId,
                    item,
                    cancellationToken);

                return new OperationalSecurityFindingIngestItemResult
                {
                    Index = index,
                    Succeeded = true,
                    FindingId = findingId,
                };
            }

            IReadOnlyList<OperationalSecurityFindingMetadataRecord> currentMetadata =
                await repository.ListMetadataByFindingInScopeAsync(
                    scope.ToProjectScopeKey(), existing.FindingId, cancellationToken);
            OperationalSecurityFindingMetadataRecord? currentAdvisoryRow = currentMetadata
                .FirstOrDefault(row => AdvisoryRemediationEvidence.IsMetadataKey(row.MetadataKey));

            if (advisory is null && currentAdvisoryRow is not null)
                return Rejected(index, "Advisory status is set by the remediation lifecycle.");

            if (advisory is not null
                && (AdvisoryRemediationEvidence.Parse(currentAdvisoryRow?.MetadataValue) is not { } previous
                    || !string.Equals(previous.AdvisoryId, advisory.AdvisoryId, StringComparison.OrdinalIgnoreCase)
                    || existing.CloudResourceId != item.CloudResourceId))
                return Rejected(index, "Advisory revisions must retain the same advisory and deployment identity.");

            bool samePayload = OperationalSecurityFindingGuard.PayloadHashesEqual(
                existing.PayloadHashSha256,
                payloadHash);

            bool mayRevise = alias is null || currentMetadata.Any(row =>
                string.Equals(row.MetadataKey, AdvisoryAliasInput.AuthorityKey, StringComparison.Ordinal)
                && string.Equals(row.MetadataValue, authority, StringComparison.Ordinal));
            bool newSource = alias is not null && !currentMetadata.Any(row =>
                string.Equals(row.MetadataKey, provenance.Key, StringComparison.Ordinal));

            if (alias is not null && (alias.ReferenceOnly
                    || (samePayload && (!mayRevise || observedUtc <= existing.LastObservedUtc))))
            {
                // Provenance-only reports do not touch observation time, lifecycle status, or verification proof.
                if (newSource)
                {
                    await repository.AppendAdvisorySourceInScopeAsync(
                        scope.ToProjectScopeKey(), existing.FindingId, provenance.Key, provenance.Value!, cancellationToken);
                }

                return new OperationalSecurityFindingIngestItemResult
                {
                    Index = index, Succeeded = true, WasDeduplicated = true, FindingId = existing.FindingId,
                };
            }

            if (!mayRevise)
                return Rejected(index, "Only the original publisher source may revise canonical advisory facts.");

            if (observedUtc < existing.LastObservedUtc || (advisory is not null && observedUtc == existing.LastObservedUtc))
            {
                return new OperationalSecurityFindingIngestItemResult
                {
                    Index = index,
                    Succeeded = samePayload,
                    WasDeduplicated = samePayload,
                    FindingId = existing.FindingId,
                    ErrorMessage = samePayload ? null : observedUtc < existing.LastObservedUtc
                        ? "Observation is older than the current operational finding."
                        : "A changed advisory revision must have a newer observation time.",
                };
            }

            if (samePayload)
            {
                OperationalSecurityFindingRecord touchRecord = CloneFinding(
                    existing,
                    lastObservedUtc: observedUtc,
                    updatedUtc: alias is null ? observedUtc : existing.UpdatedUtc);

                await repository.UpdateInScopeAsync(
                    scope.ToProjectScopeKey(),
                    ToMutation(touchRecord) with
                    {
                        ExpectedPayloadHashSha256 = advisory is null ? null : existing.PayloadHashSha256,
                        ExpectedStatus = advisory is null ? null : existing.Status,
                    },
                    newSource ? BuildMetadata(existing.FindingId, scope.TenantId,
                        new Dictionary<string, string?> { [provenance.Key] = provenance.Value }).Select(ToMutation).ToList() : [],
                    observation: null,
                    cancellationToken);

                await LogAuditAsync(
                    scope,
                    actorId,
                    AuditEventTypes.OperationalSecurityFindingDeduplicated,
                    existing.FindingId,
                    item,
                    cancellationToken);

                return new OperationalSecurityFindingIngestItemResult
                {
                    Index = index,
                    Succeeded = true,
                    WasDeduplicated = true,
                    FindingId = existing.FindingId,
                };
            }

            OperationalSecurityFindingStatus nextStatus = ResolveUpdatedStatus(existing.Status, incomingStatus);

            OperationalSecurityFindingRecord updatedFinding = CloneFinding(
                existing,
                cloudResourceId: item.CloudResourceId ?? existing.CloudResourceId,
                externalResourceId: item.ExternalResourceId?.Trim() ?? existing.ExternalResourceId,
                resourceType: item.ResourceType?.Trim() ?? existing.ResourceType,
                subscriptionOrAccountId: item.SubscriptionOrAccountId?.Trim() ?? existing.SubscriptionOrAccountId,
                controlId: alias is null ? item.ControlId?.Trim() ?? existing.ControlId : item.ControlId,
                controlFramework: alias is null ? item.ControlFramework?.Trim() ?? existing.ControlFramework : null,
                replaceControl: alias is not null,
                title: item.Title.Trim(),
                description: item.Description?.Trim() ?? existing.Description,
                severity: item.Severity?.Trim() ?? existing.Severity,
                riskScore: item.RiskScore ?? existing.RiskScore,
                exploitability: item.Exploitability?.Trim() ?? existing.Exploitability,
                exposure: item.Exposure?.Trim() ?? existing.Exposure,
                businessCriticality: item.BusinessCriticality?.Trim() ?? existing.BusinessCriticality,
                blastRadius: item.BlastRadius?.Trim() ?? existing.BlastRadius,
                lastObservedUtc: observedUtc,
                status: nextStatus,
                rawEvidenceReference: item.RawEvidenceReference?.Trim() ?? existing.RawEvidenceReference,
                assessmentId: item.AssessmentId ?? existing.AssessmentId,
                inventoryDiffId: item.InventoryDiffId ?? existing.InventoryDiffId,
                auditEvidenceSnapshotId: item.AuditEvidenceSnapshotId ?? existing.AuditEvidenceSnapshotId,
                pathId: item.PathId ?? existing.PathId,
                payloadHashSha256: payloadHash,
                updatedUtc: observedUtc);

            OperationalSecurityFindingObservationRecord observationRecord = BuildObservation(
                existing.FindingId,
                scope.TenantId,
                item,
                observedUtc,
                nextStatus,
                payloadHash);

            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadataRows =
                BuildMetadata(existing.FindingId, scope.TenantId, item.Metadata);

            await repository.UpdateInScopeAsync(
                scope.ToProjectScopeKey(),
                ToMutation(updatedFinding) with
                {
                    ExpectedPayloadHashSha256 = advisory is null ? null : existing.PayloadHashSha256,
                    ExpectedStatus = advisory is null ? null : existing.Status,
                },
                metadataRows.Select(ToMutation).ToList(),
                ToMutation(observationRecord),
                cancellationToken);

            await LogAuditAsync(
                scope,
                actorId,
                AuditEventTypes.OperationalSecurityFindingIngested,
                existing.FindingId,
                item,
                cancellationToken);

            return new OperationalSecurityFindingIngestItemResult
            {
                Index = index,
                Succeeded = true,
                FindingId = existing.FindingId,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarningWithExceptionAndTwoSanitizedUserStrings(
                ex,
                "Operational security finding ingest failed for SourceSystem={SourceSystem} SourceFindingId={SourceFindingId}.",
                item.SourceSystem,
                item.SourceFindingId);

            return new OperationalSecurityFindingIngestItemResult
            {
                Index = index,
                Succeeded = false,
                ErrorMessage = "Operational security finding ingest failed.",
            };
        }
    }

    private async Task<string?> ResolveAdvisoryControlAsync(
        Guid tenantId, AdvisoryAliasInput alias, CancellationToken cancellationToken)
    {
        if (crosswalk is null || string.IsNullOrWhiteSpace(alias.DefenderRecommendationId)
            || string.IsNullOrWhiteSpace(alias.CrosswalkVersion))
            return null;

        SecurityCrosswalkResolveResult result = await crosswalk.ResolveEvaluationMappingsAsync(
            tenantId, SecurityCrosswalkEndpointKind.DefenderRecommendation,
            alias.DefenderRecommendationId.Trim(), alias.CrosswalkVersion.Trim(), cancellationToken);
        string[] controls = result.EvaluationEligibleMappings
            .Where(mapping => mapping.HumanVerified
                && mapping.TargetEndpointKind is SecurityCrosswalkEndpointKind.ArchitecturePolicyRule
                    or SecurityCrosswalkEndpointKind.AuditControl
                && mapping.MappingType is SecurityCrosswalkMappingType.Equivalent
                    or SecurityCrosswalkMappingType.Mitigates
                    or SecurityCrosswalkMappingType.Implements
                && mapping.TargetEndpointId.Trim().Length is > 0 and <= 256)
            .Select(mapping => mapping.TargetEndpointId.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(2)
            .ToArray();
        return controls.Length == 1 ? controls[0] : null;
    }

    private static OperationalSecurityFindingIngestItemResult Rejected(int index, string error) =>
        new() { Index = index, Succeeded = false, ErrorMessage = error };

    private static OperationalSecurityFindingRecord CloneFinding(
        OperationalSecurityFindingRecord source,
        Guid? cloudResourceId = null,
        string? externalResourceId = null,
        string? resourceType = null,
        string? subscriptionOrAccountId = null,
        string? controlId = null,
        string? controlFramework = null,
        bool replaceControl = false,
        string? title = null,
        string? description = null,
        string? severity = null,
        decimal? riskScore = null,
        string? exploitability = null,
        string? exposure = null,
        string? businessCriticality = null,
        string? blastRadius = null,
        DateTime? lastObservedUtc = null,
        OperationalSecurityFindingStatus? status = null,
        string? rawEvidenceReference = null,
        Guid? assessmentId = null,
        Guid? inventoryDiffId = null,
        Guid? auditEvidenceSnapshotId = null,
        Guid? pathId = null,
        byte[]? payloadHashSha256 = null,
        DateTime? updatedUtc = null) =>
        new()
        {
            FindingId = source.FindingId,
            TenantId = source.TenantId,
            WorkspaceId = source.WorkspaceId,
            ProjectId = source.ProjectId,
            Provider = source.Provider,
            SourceSystem = source.SourceSystem,
            SourceFindingId = source.SourceFindingId,
            CloudResourceId = cloudResourceId ?? source.CloudResourceId,
            ExternalResourceId = externalResourceId ?? source.ExternalResourceId,
            ResourceType = resourceType ?? source.ResourceType,
            SubscriptionOrAccountId = subscriptionOrAccountId ?? source.SubscriptionOrAccountId,
            ControlId = replaceControl ? controlId : controlId ?? source.ControlId,
            ControlFramework = replaceControl ? controlFramework : controlFramework ?? source.ControlFramework,
            Title = title ?? source.Title,
            Description = description ?? source.Description,
            Severity = severity ?? source.Severity,
            RiskScore = riskScore ?? source.RiskScore,
            Exploitability = exploitability ?? source.Exploitability,
            Exposure = exposure ?? source.Exposure,
            BusinessCriticality = businessCriticality ?? source.BusinessCriticality,
            BlastRadius = blastRadius ?? source.BlastRadius,
            FirstObservedUtc = source.FirstObservedUtc,
            LastObservedUtc = lastObservedUtc ?? source.LastObservedUtc,
            Status = status ?? source.Status,
            RawEvidenceReference = rawEvidenceReference ?? source.RawEvidenceReference,
            AssessmentId = assessmentId ?? source.AssessmentId,
            InventoryDiffId = inventoryDiffId ?? source.InventoryDiffId,
            AuditEvidenceSnapshotId = auditEvidenceSnapshotId ?? source.AuditEvidenceSnapshotId,
            PathId = pathId ?? source.PathId,
            PayloadHashSha256 = payloadHashSha256 ?? source.PayloadHashSha256,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = updatedUtc ?? source.UpdatedUtc,
        };

    private static OperationalSecurityFindingMutation ToMutation(OperationalSecurityFindingRecord source) =>
        new()
        {
            FindingId = source.FindingId,
            CloudResourceId = source.CloudResourceId,
            ExternalResourceId = source.ExternalResourceId,
            ResourceType = source.ResourceType,
            SubscriptionOrAccountId = source.SubscriptionOrAccountId,
            ControlId = source.ControlId,
            ControlFramework = source.ControlFramework,
            Title = source.Title,
            Description = source.Description,
            Severity = source.Severity,
            RiskScore = source.RiskScore,
            Exploitability = source.Exploitability,
            Exposure = source.Exposure,
            BusinessCriticality = source.BusinessCriticality,
            BlastRadius = source.BlastRadius,
            LastObservedUtc = source.LastObservedUtc,
            Status = source.Status,
            RawEvidenceReference = source.RawEvidenceReference,
            AssessmentId = source.AssessmentId,
            InventoryDiffId = source.InventoryDiffId,
            AuditEvidenceSnapshotId = source.AuditEvidenceSnapshotId,
            PathId = source.PathId,
            PayloadHashSha256 = source.PayloadHashSha256,
            UpdatedUtc = source.UpdatedUtc,
        };

    private static OperationalSecurityFindingMetadataMutation ToMutation(
        OperationalSecurityFindingMetadataRecord source) =>
        new()
        {
            MetadataRowId = source.MetadataRowId,
            FindingId = source.FindingId,
            MetadataKey = source.MetadataKey,
            MetadataValue = source.MetadataValue,
        };

    private static OperationalSecurityFindingObservationMutation ToMutation(
        OperationalSecurityFindingObservationRecord source) =>
        new()
        {
            ObservationId = source.ObservationId,
            FindingId = source.FindingId,
            ObservedUtc = source.ObservedUtc,
            Status = source.Status,
            Severity = source.Severity,
            RiskScore = source.RiskScore,
            Summary = source.Summary ?? string.Empty,
            PayloadHashSha256 = source.PayloadHashSha256,
            SourceSystem = source.SourceSystem,
        };

    private static OperationalSecurityFindingStatus ResolveUpdatedStatus(
        OperationalSecurityFindingStatus existingStatus,
        OperationalSecurityFindingStatus incomingStatus)
    {
        if (existingStatus == OperationalSecurityFindingStatus.Closed
            && incomingStatus == OperationalSecurityFindingStatus.Open)
        {
            return OperationalSecurityFindingStatus.Recurred;
        }

        return incomingStatus;
    }

    private static OperationalSecurityFindingRecord BuildFindingRecord(
        Guid findingId,
        ScopeContext scope,
        OperationalSecurityFindingIngestItem item,
        DateTime firstObservedUtc,
        DateTime lastObservedUtc,
        OperationalSecurityFindingStatus status,
        byte[] payloadHash,
        DateTime utcNow) =>
        new()
        {
            FindingId = findingId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            Provider = item.Provider,
            SourceSystem = item.SourceSystem.Trim(),
            SourceFindingId = item.SourceFindingId.Trim(),
            CloudResourceId = item.CloudResourceId,
            ExternalResourceId = item.ExternalResourceId?.Trim(),
            ResourceType = item.ResourceType?.Trim(),
            SubscriptionOrAccountId = item.SubscriptionOrAccountId?.Trim(),
            ControlId = item.ControlId?.Trim(),
            ControlFramework = item.ControlFramework?.Trim(),
            Title = item.Title.Trim(),
            Description = item.Description?.Trim(),
            Severity = item.Severity?.Trim(),
            RiskScore = item.RiskScore,
            Exploitability = item.Exploitability?.Trim(),
            Exposure = item.Exposure?.Trim(),
            BusinessCriticality = item.BusinessCriticality?.Trim(),
            BlastRadius = item.BlastRadius?.Trim(),
            FirstObservedUtc = firstObservedUtc,
            LastObservedUtc = lastObservedUtc,
            Status = status,
            RawEvidenceReference = item.RawEvidenceReference?.Trim(),
            AssessmentId = item.AssessmentId,
            InventoryDiffId = item.InventoryDiffId,
            AuditEvidenceSnapshotId = item.AuditEvidenceSnapshotId,
            PathId = item.PathId,
            PayloadHashSha256 = payloadHash,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

    private static OperationalSecurityFindingObservationRecord BuildObservation(
        Guid findingId,
        Guid tenantId,
        OperationalSecurityFindingIngestItem item,
        DateTime observedUtc,
        OperationalSecurityFindingStatus status,
        byte[] payloadHash) =>
        new()
        {
            ObservationId = Guid.NewGuid(),
            FindingId = findingId,
            TenantId = tenantId,
            ObservedUtc = observedUtc,
            Status = status,
            Severity = item.Severity?.Trim(),
            RiskScore = item.RiskScore,
            Summary = item.Description?.Trim() ?? item.Title.Trim(),
            PayloadHashSha256 = payloadHash,
            SourceSystem = item.SourceSystem.Trim(),
        };

    private static IReadOnlyList<OperationalSecurityFindingMetadataRecord> BuildMetadata(
        Guid findingId,
        Guid tenantId,
        IReadOnlyDictionary<string, string?> metadata) =>
        metadata
            .Select(pair => new OperationalSecurityFindingMetadataRecord
            {
                MetadataRowId = Guid.NewGuid(),
                FindingId = findingId,
                TenantId = tenantId,
                MetadataKey = pair.Key.Trim(),
                MetadataValue = pair.Value,
            })
            .ToList();

    private async Task LogAuditAsync(
        ScopeContext scope,
        string actorId,
        string eventType,
        Guid findingId,
        OperationalSecurityFindingIngestItem item,
        CancellationToken cancellationToken)
    {
        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = eventType,
                ActorUserId = actorId,
                ActorUserName = actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        findingId,
                        provider = item.Provider.ToString(),
                        sourceSystem = item.SourceSystem.Trim(),
                        sourceFindingId = item.SourceFindingId.Trim(),
                    },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);
    }
}
