using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.InfraEvidence;

public sealed class CloudResourceEvidenceHubService(
    ICloudResourceIdentityDirectory identityDirectory,
    IAzureInventorySnapshotRepository snapshotRepository,
    IAzureInventoryDiffRepository diffRepository,
    IAdvisoryTerraformRepresentationRepository terraformRepository,
    IDiagramInfrastructureReconciliationService diagramReconciliationService,
    IOperationalSecurityFindingRepository operationalFindingRepository,
    IRemediationInstanceRepository remediationInstanceRepository,
    IAuthorityQueryService authorityQueryService,
    ICloudResourceAuditLineageResolver auditLineageResolver) : ICloudResourceEvidenceHubService
{
    private const int RecentChangeTake = 25;

    public async Task<CloudResourceEvidenceHubQueryResult> TryGetHubAsync(
        ScopeContext scope,
        Guid cloudResourceId,
        CloudResourceEvidenceHubQuery query,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(query);

        if (cloudResourceId == Guid.Empty)
        {
            return new CloudResourceEvidenceHubQueryResult
            {
                Succeeded = false,
                ErrorMessage = "CloudResourceId is required.",
            };
        }

        CloudResourceIdentityRecord? identity =
            await identityDirectory.TryGetByCloudResourceIdAsync(scope, cloudResourceId, cancellationToken);

        if (identity is null || identity.TenantId != scope.TenantId)
        {
            return new CloudResourceEvidenceHubQueryResult
            {
                Succeeded = false,
                ErrorMessage = "Cloud resource was not found in the current tenant scope.",
            };
        }

        (int page, int pageSize) = PaginationDefaults.Normalize(query.Page, query.PageSize);
        Guid snapshotId = query.SnapshotId ?? identity.LastSeenSnapshotId ?? Guid.Empty;

        AzureInventorySnapshotDetailReadModel? snapshotDetail = snapshotId != Guid.Empty
            ? await snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken)
            : null;

        AzureInventoryResourceRecord? resourceRow = snapshotDetail?.Resources
            .FirstOrDefault(row => row.CloudResourceId == cloudResourceId);

        CloudResourceCurrentConfigurationSection? currentConfiguration =
            resourceRow is null ? null : MapCurrentConfiguration(snapshotId, resourceRow, snapshotDetail!);

        (string? terraformAddress, string? terraformGenerationMethod) =
            await ResolveTerraformMappingAsync(scope, snapshotId, cloudResourceId, cancellationToken);

        DiagramInfrastructureCorrespondenceRow? diagramCorrespondence =
            await ResolveDiagramCorrespondenceAsync(
                scope,
                query.RunId,
                snapshotId,
                cloudResourceId,
                cancellationToken);

        IReadOnlyList<OperationalSecurityFindingRecord> operationalPage;
        int operationalTotal;
        (operationalPage, operationalTotal) =
            await operationalFindingRepository.ListByCloudResourceIdPagedAsync(
                scope.TenantId,
                cloudResourceId,
                page,
                pageSize,
                cancellationToken);

        List<CloudResourceEvidenceFindingHubItem> architectureItems =
            await ResolveArchitectureFindingsAsync(
                scope,
                query.RunId,
                identity.ExternalResourceIdNormalized,
                diagramCorrespondence,
                cancellationToken);

        IReadOnlyList<RemediationInstanceRecord> remediationPage;
        int remediationTotal;
        (remediationPage, remediationTotal) =
            await remediationInstanceRepository.ListByCloudResourceIdPagedAsync(
                scope.TenantId,
                cloudResourceId,
                page,
                pageSize,
                cancellationToken);

        List<CloudResourceInventoryChangeSummary> recentChanges =
            await ResolveRecentChangesAsync(
                scope,
                identity,
                snapshotId,
                cloudResourceId,
                cancellationToken);

        CloudResourceAuditLineageLink auditLineageLink = await auditLineageResolver.ResolveAsync(
            scope,
            cloudResourceId,
            query,
            cancellationToken);
        List<CloudResourceEvidencePointer> evidencePointers = BuildEvidencePointers(
            query,
            recentChanges,
            diagramCorrespondence is not null);

        CloudResourceEvidenceHubResponse hub = new()
        {
            CloudResourceId = cloudResourceId,
            ExternalResourceId = identity.ExternalResourceIdNormalized,
            ResourceType = identity.ResourceType ?? resourceRow?.ResourceType,
            CurrentConfiguration = currentConfiguration,
            TerraformAddress = terraformAddress,
            TerraformGenerationMethod = terraformGenerationMethod,
            DiagramCorrespondence = diagramCorrespondence,
            OperationalSecurityFindings = BuildFindingStreamPage(
                CloudResourceEvidenceFindingStreamKinds.OperationalSecurity,
                CloudResourceEvidenceFindingStreamLabels.OperationalSecurity,
                operationalPage.Select(MapOperationalFinding).ToList(),
                page,
                pageSize,
                operationalTotal),
            ArchitectureReviewFindings = BuildFindingStreamPage(
                CloudResourceEvidenceFindingStreamKinds.ArchitectureReview,
                CloudResourceEvidenceFindingStreamLabels.ArchitectureReview,
                architectureItems,
                page,
                pageSize,
                architectureItems.Count),
            RemediationInstances = BuildRemediationPage(remediationPage, page, pageSize, remediationTotal),
            RbacAssignments = MapRbacAssignments(snapshotDetail, identity.ExternalResourceIdNormalized),
            NetworkRelationships = MapNetworkRelationships(snapshotDetail, identity.ExternalResourceIdNormalized),
            RecentChanges = recentChanges,
            AuditLineageLink = auditLineageLink,
            EvidencePointers = evidencePointers,
        };

        return new CloudResourceEvidenceHubQueryResult
        {
            Succeeded = true,
            Hub = hub,
        };
    }

    private static CloudResourceCurrentConfigurationSection MapCurrentConfiguration(
        Guid snapshotId,
        AzureInventoryResourceRecord resourceRow,
        AzureInventorySnapshotDetailReadModel snapshotDetail)
    {
        Dictionary<string, string> properties = snapshotDetail.Properties
            .Where(row => row.ResourceRowId == resourceRow.ResourceRowId && !row.IsRedacted)
            .ToDictionary(row => row.PropertyKey, row => row.PropertyValue ?? string.Empty, StringComparer.OrdinalIgnoreCase);

        Dictionary<string, string> tags = snapshotDetail.Tags
            .Where(row => row.ResourceRowId == resourceRow.ResourceRowId)
            .ToDictionary(row => row.TagKey, row => row.TagValue ?? string.Empty, StringComparer.OrdinalIgnoreCase);

        return new CloudResourceCurrentConfigurationSection
        {
            SnapshotId = snapshotId,
            AzureResourceId = resourceRow.AzureResourceId,
            ResourceType = resourceRow.ResourceType,
            ResourceGroup = resourceRow.ResourceGroup,
            Region = resourceRow.Region,
            Properties = properties,
            Tags = tags,
        };
    }

    private async Task<(string? Address, string? GenerationMethod)> ResolveTerraformMappingAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid cloudResourceId,
        CancellationToken cancellationToken)
    {
        if (snapshotId == Guid.Empty)
            return (null, null);

        IReadOnlyList<AdvisoryTerraformResourceMappingRecord> mappings =
            await terraformRepository.ListMappingsBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        AdvisoryTerraformResourceMappingRecord? match = mappings
            .FirstOrDefault(row => row.CloudResourceId == cloudResourceId);

        if (match is null)
            return (null, null);

        return (match.TerraformAddress, match.GenerationMethod.ToString());
    }

    private async Task<DiagramInfrastructureCorrespondenceRow?> ResolveDiagramCorrespondenceAsync(
        ScopeContext scope,
        Guid? runId,
        Guid snapshotId,
        Guid cloudResourceId,
        CancellationToken cancellationToken)
    {
        if (!runId.HasValue || runId.Value == Guid.Empty || snapshotId == Guid.Empty)
            return null;

        DiagramInfrastructureReconciliationResult? reconciliation =
            await diagramReconciliationService.TryGetReconciliationAsync(
                scope,
                runId.Value,
                snapshotId,
                cancellationToken);

        return reconciliation?.Rows.FirstOrDefault(row => row.CloudResourceId == cloudResourceId);
    }

    private async Task<List<CloudResourceEvidenceFindingHubItem>> ResolveArchitectureFindingsAsync(
        ScopeContext scope,
        Guid? runId,
        string externalResourceId,
        DiagramInfrastructureCorrespondenceRow? diagramCorrespondence,
        CancellationToken cancellationToken)
    {
        if (!runId.HasValue || runId.Value == Guid.Empty)
            return [];

        RunDetailDto? detail = await authorityQueryService.GetRunDetailForBuyerSummaryAsync(
            scope,
            runId.Value,
            cancellationToken);

        if (detail?.FindingsSnapshot?.Findings is not { Count: > 0 } findings)
            return [];

        HashSet<string> relatedNodeIds = BuildRelatedNodeIds(detail.GraphSnapshot, externalResourceId, diagramCorrespondence);

        return findings
            .Where(finding => ArchitectureFindingMatchesResource(finding, relatedNodeIds, externalResourceId))
            .Select(MapArchitectureFinding)
            .OrderByDescending(item => item.Severity ?? string.Empty, StringComparer.OrdinalIgnoreCase)
            .ThenBy(item => item.Title, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static HashSet<string> BuildRelatedNodeIds(
        GraphSnapshot? graphSnapshot,
        string externalResourceId,
        DiagramInfrastructureCorrespondenceRow? diagramCorrespondence)
    {
        HashSet<string> nodeIds = new(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(diagramCorrespondence?.DiagramNodeId))
            nodeIds.Add(diagramCorrespondence.DiagramNodeId);

        if (graphSnapshot is null)
            return nodeIds;

        foreach (GraphNode node in graphSnapshot.Nodes)
        {
            if (NodeReferencesResource(node, externalResourceId))
                nodeIds.Add(node.NodeId);
        }

        return nodeIds;
    }

    private static bool NodeReferencesResource(GraphNode node, string externalResourceId)
    {
        if (string.Equals(node.SourceId, externalResourceId, StringComparison.OrdinalIgnoreCase))
            return true;

        foreach (KeyValuePair<string, string> property in node.Properties)
        {
            if (property.Value.Contains(externalResourceId, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return node.Label.Contains(externalResourceId, StringComparison.OrdinalIgnoreCase);
    }

    private static bool ArchitectureFindingMatchesResource(
        Finding finding,
        HashSet<string> relatedNodeIds,
        string externalResourceId)
    {
        if (relatedNodeIds.Count > 0
            && finding.RelatedNodeIds.Any(nodeId => relatedNodeIds.Contains(nodeId)))
        {
            return true;
        }

        if (finding.Title.Contains(externalResourceId, StringComparison.OrdinalIgnoreCase))
            return true;

        if (finding.Rationale.Contains(externalResourceId, StringComparison.OrdinalIgnoreCase))
            return true;

        return finding.Properties.Values.Any(
            value => value.Contains(externalResourceId, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<List<CloudResourceInventoryChangeSummary>> ResolveRecentChangesAsync(
        ScopeContext scope,
        CloudResourceIdentityRecord identity,
        Guid snapshotId,
        Guid cloudResourceId,
        CancellationToken cancellationToken)
    {
        Guid newerSnapshotId = snapshotId != Guid.Empty ? snapshotId : identity.LastSeenSnapshotId ?? Guid.Empty;

        if (newerSnapshotId == Guid.Empty || string.IsNullOrWhiteSpace(identity.SubscriptionOrAccountId))
            return [];

        Guid? priorSnapshotId = await snapshotRepository.TryGetPriorMaterializedSnapshotIdAsync(
            scope,
            identity.SubscriptionOrAccountId,
            newerSnapshotId,
            cancellationToken);

        if (!priorSnapshotId.HasValue || priorSnapshotId.Value == Guid.Empty)
            return [];

        AzureInventoryDiffSummaryRecord? diffSummary = await diffRepository.TryGetBySnapshotPairAsync(
            scope,
            priorSnapshotId.Value,
            newerSnapshotId,
            cancellationToken);

        if (diffSummary is null)
            return [];

        IReadOnlyList<AzureInventoryChangeRecord> changes =
            await diffRepository.ListChangesByDiffIdAsync(scope, diffSummary.DiffId, cancellationToken);

        return changes
            .Where(change => change.CloudResourceId == cloudResourceId)
            .Take(RecentChangeTake)
            .Select(change => new CloudResourceInventoryChangeSummary
            {
                ChangeId = change.ChangeId,
                DiffId = change.DiffId,
                SnapshotAId = change.SnapshotAId,
                SnapshotBId = change.SnapshotBId,
                ChangeType = change.ChangeType.ToString(),
                Property = change.Property,
                OldValue = change.OldValue,
                NewValue = change.NewValue,
                RiskClassification = change.RiskClassification,
            })
            .ToList();
    }

    private static List<CloudResourceEvidencePointer> BuildEvidencePointers(
        CloudResourceEvidenceHubQuery query,
        IReadOnlyList<CloudResourceInventoryChangeSummary> recentChanges,
        bool hasDiagramCorrespondence)
    {
        List<CloudResourceEvidencePointer> pointers = [];

        if (recentChanges.Count > 0)
        {
            Guid diffId = recentChanges[0].DiffId;

            pointers.Add(new CloudResourceEvidencePointer
            {
                Kind = "InventoryDiffDriftReport",
                RelativePath = $"/v1/infra-evidence/azure-inventory/diffs/{diffId:D}/drift-report",
            });
        }

        if (hasDiagramCorrespondence
            && query.RunId.HasValue
            && query.SnapshotId.HasValue
            && query.RunId.Value != Guid.Empty
            && query.SnapshotId.Value != Guid.Empty)
        {
            pointers.Add(new CloudResourceEvidencePointer
            {
                Kind = "DiagramReconciliation",
                RelativePath =
                    $"/v1/architecture/runs/{query.RunId.Value:D}/diagrams/reconciliation?snapshotId={query.SnapshotId.Value:D}",
            });
        }

        return pointers;
    }

    private static List<CloudResourceRbacAssignmentSummary> MapRbacAssignments(
        AzureInventorySnapshotDetailReadModel? snapshotDetail,
        string externalResourceId)
    {
        if (snapshotDetail is null)
            return [];

        return snapshotDetail.RoleAssignments
            .Where(row => ScopeMatchesResource(row.Scope, externalResourceId))
            .Select(row => new CloudResourceRbacAssignmentSummary
            {
                Scope = row.Scope,
                PrincipalId = row.PrincipalId,
                RoleDefinitionId = row.RoleDefinitionId,
            })
            .ToList();
    }

    private static List<CloudResourceNetworkRelationshipSummary> MapNetworkRelationships(
        AzureInventorySnapshotDetailReadModel? snapshotDetail,
        string externalResourceId)
    {
        if (snapshotDetail is null)
            return [];

        return snapshotDetail.Relationships
            .Where(row => string.Equals(row.FromAzureResourceId, externalResourceId, StringComparison.OrdinalIgnoreCase)
                || string.Equals(row.ToAzureResourceId, externalResourceId, StringComparison.OrdinalIgnoreCase))
            .Select(row => new CloudResourceNetworkRelationshipSummary
            {
                RelationshipType = row.RelationshipType,
                FromAzureResourceId = row.FromAzureResourceId,
                ToAzureResourceId = row.ToAzureResourceId,
            })
            .ToList();
    }

    private static bool ScopeMatchesResource(string scope, string externalResourceId)
    {
        return string.Equals(scope, externalResourceId, StringComparison.OrdinalIgnoreCase)
            || scope.StartsWith(externalResourceId + "/", StringComparison.OrdinalIgnoreCase);
    }

    private static CloudResourceEvidenceFindingStreamPage BuildFindingStreamPage(
        string streamKind,
        string streamLabel,
        IReadOnlyList<CloudResourceEvidenceFindingHubItem> pageItems,
        int page,
        int pageSize,
        int totalCount)
    {
        int skip = PaginationDefaults.ToSkip(page, pageSize);

        return new CloudResourceEvidenceFindingStreamPage
        {
            StreamKind = streamKind,
            StreamLabel = streamLabel,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            HasMore = skip + pageItems.Count < totalCount,
            Items = pageItems.ToList(),
        };
    }

    private static CloudResourceRemediationStreamPage BuildRemediationPage(
        IReadOnlyList<RemediationInstanceRecord> pageRows,
        int page,
        int pageSize,
        int totalCount)
    {
        int skip = PaginationDefaults.ToSkip(page, pageSize);
        List<CloudResourceRemediationHubItem> pageItems = pageRows
            .Select(row => new CloudResourceRemediationHubItem
            {
                InstanceId = row.InstanceId,
                PatternKey = row.PatternKey,
                Status = row.Status.ToString(),
            })
            .ToList();

        return new CloudResourceRemediationStreamPage
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            HasMore = skip + pageItems.Count < totalCount,
            Items = pageItems,
        };
    }

    private static CloudResourceEvidenceFindingHubItem MapOperationalFinding(OperationalSecurityFindingRecord row)
        => new()
        {
            StreamKind = CloudResourceEvidenceFindingStreamKinds.OperationalSecurity,
            StreamLabel = CloudResourceEvidenceFindingStreamLabels.OperationalSecurity,
            Id = row.FindingId.ToString("D"),
            Title = row.Title,
            Severity = row.Severity,
            Status = row.Status.ToString(),
        };

    private static CloudResourceEvidenceFindingHubItem MapArchitectureFinding(Finding finding)
        => new()
        {
            StreamKind = CloudResourceEvidenceFindingStreamKinds.ArchitectureReview,
            StreamLabel = CloudResourceEvidenceFindingStreamLabels.ArchitectureReview,
            Id = finding.FindingId,
            Title = finding.Title,
            Severity = finding.Severity.ToString(),
            Status = finding.Classification?.ToString(),
        };
}
