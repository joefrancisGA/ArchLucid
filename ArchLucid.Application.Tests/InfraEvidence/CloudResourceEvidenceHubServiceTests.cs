using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class CloudResourceEvidenceHubServiceTests
{
    private static ScopeContext CreateScope(Guid? tenantId = null) =>
        new()
        {
            TenantId = tenantId ?? Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

    [Fact]
    public async Task TryGetHubAsync_unknown_cloud_resource_returns_not_found()
    {
        ScopeContext scope = CreateScope();
        FakeCloudResourceIdentityDirectory identityDirectory = new();

        CloudResourceEvidenceHubService service = CreateService(identityDirectory);

        CloudResourceEvidenceHubQueryResult result = await service.TryGetHubAsync(
            scope,
            Guid.NewGuid(),
            new CloudResourceEvidenceHubQuery(),
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("not found");
    }

    [Fact]
    public async Task TryGetHubAsync_wrong_tenant_returns_not_found()
    {
        Guid cloudResourceId = Guid.NewGuid();
        ScopeContext scope = CreateScope();

        FakeCloudResourceIdentityDirectory identityDirectory = new();
        identityDirectory.Records[cloudResourceId] = new CloudResourceIdentityRecord
        {
            CloudResourceId = cloudResourceId,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            Provider = CloudProvider.Azure,
            ExternalResourceIdNormalized =
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-1",
            LastSeenSnapshotId = Guid.NewGuid(),
        };

        CloudResourceEvidenceHubService service = CreateService(identityDirectory);

        CloudResourceEvidenceHubQueryResult result = await service.TryGetHubAsync(
            scope,
            cloudResourceId,
            new CloudResourceEvidenceHubQuery(),
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
    }

    [Fact]
    public async Task TryGetHubAsync_labels_operational_and_architecture_finding_streams_separately()
    {
        Guid cloudResourceId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        ScopeContext scope = CreateScope(tenantId);

        const string externalResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-1";

        FakeCloudResourceIdentityDirectory identityDirectory = new();
        identityDirectory.Records[cloudResourceId] = new CloudResourceIdentityRecord
        {
            CloudResourceId = cloudResourceId,
            TenantId = tenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            Provider = CloudProvider.Azure,
            ExternalResourceIdNormalized = externalResourceId,
            LastSeenSnapshotId = snapshotId,
        };

        FakeOperationalSecurityFindingRepository operationalRepository = new();
        operationalRepository.Findings.Add(new OperationalSecurityFindingRecord
        {
            FindingId = Guid.NewGuid(),
            TenantId = tenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            Provider = CloudProvider.Azure,
            SourceSystem = "defender",
            SourceFindingId = "finding-1",
            CloudResourceId = cloudResourceId,
            Title = "Public endpoint exposure",
            Severity = "High",
            Status = OperationalSecurityFindingStatus.Open,
            FirstObservedUtc = DateTime.UtcNow,
            LastObservedUtc = DateTime.UtcNow,
            PayloadHashSha256 = [],
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(service => service.GetRunDetailForBuyerSummaryAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                FindingsSnapshot = new FindingsSnapshot
                {
                    Findings =
                    [
                        new Finding
                        {
                            FindingId = "arch-finding-1",
                            Title = "Subnet segmentation gap",
                            Severity = FindingSeverity.Warning,
                            RelatedNodeIds = ["node-vm-1"],
                        },
                    ],
                },
                GraphSnapshot = new GraphSnapshot
                {
                    Nodes =
                    [
                        new GraphNode
                        {
                            NodeId = "node-vm-1",
                            NodeType = "Compute",
                            Label = "vm-1",
                            SourceId = externalResourceId,
                        },
                    ],
                },
            });

        authorityQuery
            .Setup(service => service.GetRunDetailForManifestCompareAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = new ManifestDocument
                {
                    RunId = runId,
                    ManifestHash = SealedManifestHashTestSupport.DefaultHash,
                },
            });

        CloudResourceEvidenceHubService hubService = CreateService(
            identityDirectory,
            operationalRepository: operationalRepository,
            authorityQueryService: authorityQuery.Object,
            manifestHashService: SealedManifestHashTestSupport.CreateManifestHashService());

        CloudResourceEvidenceHubQueryResult result = await hubService.TryGetHubAsync(
            scope,
            cloudResourceId,
            new CloudResourceEvidenceHubQuery { RunId = runId, SnapshotId = snapshotId },
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Hub.Should().NotBeNull();

        result.Hub!.OperationalSecurityFindings.StreamKind
            .Should().Be(CloudResourceEvidenceFindingStreamKinds.OperationalSecurity);
        result.Hub.OperationalSecurityFindings.StreamLabel
            .Should().Be(CloudResourceEvidenceFindingStreamLabels.OperationalSecurity);
        result.Hub.OperationalSecurityFindings.Items.Should().ContainSingle();
        result.Hub.OperationalSecurityFindings.Items[0].StreamKind
            .Should().Be(CloudResourceEvidenceFindingStreamKinds.OperationalSecurity);

        result.Hub.ArchitectureReviewFindings.StreamKind
            .Should().Be(CloudResourceEvidenceFindingStreamKinds.ArchitectureReview);
        result.Hub.ArchitectureReviewFindings.StreamLabel
            .Should().Be(CloudResourceEvidenceFindingStreamLabels.ArchitectureReview);
        result.Hub.ArchitectureReviewFindings.Items.Should().ContainSingle();
        result.Hub.ArchitectureReviewFindings.Items[0].StreamKind
            .Should().Be(CloudResourceEvidenceFindingStreamKinds.ArchitectureReview);
    }

    [Fact]
    public async Task TryGetHubAsync_loads_only_requested_resource_slice_without_full_snapshot_detail()
    {
        Guid cloudResourceId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01");
        Guid otherCloudResourceId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02");
        Guid tenantId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();
        ScopeContext scope = CreateScope(tenantId);

        const string externalResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-target";

        const string otherExternalResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-other";

        Guid targetResourceRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1");
        Guid otherResourceRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2");

        FakeCloudResourceIdentityDirectory identityDirectory = new();
        identityDirectory.Records[cloudResourceId] = new CloudResourceIdentityRecord
        {
            CloudResourceId = cloudResourceId,
            TenantId = tenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            Provider = CloudProvider.Azure,
            ExternalResourceIdNormalized = externalResourceId,
            LastSeenSnapshotId = snapshotId,
            SubscriptionOrAccountId = "sub",
        };

        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repo => repo.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotDetailReadModel());
        snapshotRepository
            .Setup(repo => repo.ListResourcesBySnapshotIdPagedAsync(
                scope,
                snapshotId,
                1,
                1,
                cloudResourceId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            (
                new List<AzureInventoryResourceRecord>
                {
                    new()
                    {
                        ResourceRowId = targetResourceRowId,
                        SnapshotId = snapshotId,
                        TenantId = tenantId,
                        CloudResourceId = cloudResourceId,
                        AzureResourceId = externalResourceId,
                        ResourceType = "Microsoft.Compute/virtualMachines",
                    },
                },
                1));
        snapshotRepository
            .Setup(repo => repo.ListResourcePropertiesByResourceRowIdAsync(
                scope,
                snapshotId,
                targetResourceRowId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = targetResourceRowId,
                    PropertyKey = "vmSize",
                    PropertyValue = "Standard_D2s_v3",
                    IsRedacted = false,
                },
            ]);
        snapshotRepository
            .Setup(repo => repo.ListResourceTagsByResourceRowIdAsync(
                scope,
                snapshotId,
                targetResourceRowId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AzureInventoryTagReadModel
                {
                    ResourceRowId = targetResourceRowId,
                    TagKey = "env",
                    TagValue = "dev",
                },
            ]);
        snapshotRepository
            .Setup(repo => repo.ListResourceVisibilityRowsBySnapshotIdAsync(scope, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = targetResourceRowId,
                    AzureResourceId = externalResourceId,
                    ResourceType = "Microsoft.Compute/virtualMachines",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = otherResourceRowId,
                    CloudResourceId = otherCloudResourceId,
                    AzureResourceId = otherExternalResourceId,
                    ResourceType = "Microsoft.Compute/virtualMachines",
                },
            ]);
        snapshotRepository
            .Setup(repo => repo.ListRelationshipsTouchingAzureResourceIdAsync(
                scope,
                snapshotId,
                externalResourceId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = externalResourceId,
                    ToAzureResourceId = otherExternalResourceId,
                    RelationshipType = "connectedTo",
                },
            ]);
        snapshotRepository
            .Setup(repo => repo.ListRoleAssignmentsForAzureResourceScopeAsync(
                scope,
                snapshotId,
                externalResourceId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AzureInventoryRoleAssignmentReadModel
                {
                    Scope = externalResourceId + "/nested",
                    PrincipalId = "principal-1",
                    RoleDefinitionId = "role-1",
                },
            ]);

        Mock<IAdvisoryTerraformRepresentationRepository> terraformRepository = new();
        terraformRepository
            .Setup(repo => repo.TryGetMappingByCloudResourceIdAsync(
                scope,
                snapshotId,
                cloudResourceId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AdvisoryTerraformResourceMappingRecord
            {
                CloudResourceId = cloudResourceId,
                TerraformAddress = "azurerm_virtual_machine.vm_target",
                GenerationMethod = AdvisoryTerraformGenerationMethod.SnapshotReconstruction,
            });

        CloudResourceEvidenceHubService hubService = CreateService(
            identityDirectory,
            snapshotRepository: snapshotRepository.Object,
            terraformRepository: terraformRepository.Object);

        CloudResourceEvidenceHubQueryResult result = await hubService.TryGetHubAsync(
            scope,
            cloudResourceId,
            new CloudResourceEvidenceHubQuery { SnapshotId = snapshotId },
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Hub!.CurrentConfiguration.Should().NotBeNull();
        result.Hub.CurrentConfiguration!.Properties.Should().ContainKey("vmSize");
        result.Hub.CurrentConfiguration.Tags.Should().ContainKey("env");
        result.Hub.NetworkRelationships.Should().ContainSingle();
        result.Hub.RbacAssignments.Should().ContainSingle();
        result.Hub.TerraformAddress.Should().Be("azurerm_virtual_machine.vm_target");

        snapshotRepository.Verify(
            repo => repo.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        terraformRepository.Verify(
            repo => repo.ListMappingsBySnapshotIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryGetHubAsync_uses_paged_operational_findings_by_cloud_resource_id()
    {
        Guid cloudResourceId = Guid.NewGuid();
        Guid otherCloudResourceId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        ScopeContext scope = CreateScope(tenantId);

        FakeCloudResourceIdentityDirectory identityDirectory = new();
        identityDirectory.Records[cloudResourceId] = new CloudResourceIdentityRecord
        {
            CloudResourceId = cloudResourceId,
            TenantId = tenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            Provider = CloudProvider.Azure,
            ExternalResourceIdNormalized =
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/primary",
            LastSeenSnapshotId = Guid.NewGuid(),
        };

        FakeOperationalSecurityFindingRepository operationalRepository = new();
        operationalRepository.Findings.Add(new OperationalSecurityFindingRecord
        {
            FindingId = Guid.NewGuid(),
            TenantId = tenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            Provider = CloudProvider.Azure,
            SourceSystem = "defender",
            SourceFindingId = "finding-target",
            CloudResourceId = cloudResourceId,
            Title = "Target resource finding",
            Severity = "High",
            Status = OperationalSecurityFindingStatus.Open,
            FirstObservedUtc = DateTime.UtcNow,
            LastObservedUtc = DateTime.UtcNow,
            PayloadHashSha256 = [],
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });
        operationalRepository.Findings.Add(new OperationalSecurityFindingRecord
        {
            FindingId = Guid.NewGuid(),
            TenantId = tenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            Provider = CloudProvider.Azure,
            SourceSystem = "defender",
            SourceFindingId = "finding-other",
            CloudResourceId = otherCloudResourceId,
            Title = "Other resource finding",
            Severity = "Medium",
            Status = OperationalSecurityFindingStatus.Open,
            FirstObservedUtc = DateTime.UtcNow,
            LastObservedUtc = DateTime.UtcNow,
            PayloadHashSha256 = [],
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        });

        CloudResourceEvidenceHubService hubService = CreateService(
            identityDirectory,
            operationalRepository: operationalRepository);

        CloudResourceEvidenceHubQueryResult result = await hubService.TryGetHubAsync(
            scope,
            cloudResourceId,
            new CloudResourceEvidenceHubQuery(),
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Hub.Should().NotBeNull();
        result.Hub!.OperationalSecurityFindings.Items.Should().ContainSingle();
        result.Hub.OperationalSecurityFindings.Items[0].Title.Should().Be("Target resource finding");
        result.Hub.OperationalSecurityFindings.TotalCount.Should().Be(1);
    }

    private static CloudResourceEvidenceHubService CreateService(
        FakeCloudResourceIdentityDirectory identityDirectory,
        FakeOperationalSecurityFindingRepository? operationalRepository = null,
        IAuthorityQueryService? authorityQueryService = null,
        IManifestHashService? manifestHashService = null,
        IAzureInventorySnapshotRepository? snapshotRepository = null,
        IAdvisoryTerraformRepresentationRepository? terraformRepository = null)
    {
        operationalRepository ??= new FakeOperationalSecurityFindingRepository();

        Mock<IAzureInventorySnapshotRepository> snapshotRepositoryMock = new();
        Mock<IAzureInventoryDiffRepository> diffRepository = new();
        Mock<IAdvisoryTerraformRepresentationRepository> terraformRepositoryMock = new();
        Mock<IDiagramInfrastructureReconciliationService> diagramReconciliation = new();
        Mock<IProjectScopedRemediationInstanceRepository> remediationRepository = new();
        Mock<IAuthorityQueryService> authorityQuery = new();
        Mock<ICloudResourceAuditLineageResolver> auditLineageResolver = new();
        Mock<IArchitectureDiagramReconciliationRepository> reconciliationRepository = new();

        reconciliationRepository
            .Setup(repo => repo.ListRunIdsBySnapshotAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<Guid>());
        reconciliationRepository
            .Setup(repo => repo.ListRunIdsBySnapshotIdsAsync(
                It.IsAny<Guid>(),
                It.IsAny<IReadOnlyList<Guid>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ArchitectureDiagramReconciliationSnapshotRunRecord>());

        snapshotRepositoryMock
            .Setup(repo => repo.ListResourcesBySnapshotIdPagedAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(((IReadOnlyList<AzureInventoryResourceRecord>, int)?)null);

        auditLineageResolver
            .Setup(resolver => resolver.ResolveAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CloudResourceEvidenceHubQuery>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CloudResourceAuditLineageLink
            {
                Available = false,
                DegradedReason = "No audit evidence snapshot rows reference this cloud resource yet.",
            });

        remediationRepository
            .Setup(repo => repo.ListByCloudResourceIdPagedInScopeAsync(
                It.IsAny<ProjectScopeKey>(),
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(([], 0));

        operationalRepository.Findings.ForEach(row =>
        {
            if (operationalRepository.TenantId == Guid.Empty)
                operationalRepository.TenantId = row.TenantId;
        });

        terraformRepositoryMock
            .Setup(repo => repo.TryGetMappingByCloudResourceIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((AdvisoryTerraformResourceMappingRecord?)null);

        return new CloudResourceEvidenceHubService(
            identityDirectory,
            snapshotRepository ?? snapshotRepositoryMock.Object,
            diffRepository.Object,
            terraformRepository ?? terraformRepositoryMock.Object,
            diagramReconciliation.Object,
            new ProjectScopedOperationalSecurityFindingRepositoryAdapter(operationalRepository),
            remediationRepository.Object,
            reconciliationRepository.Object,
            authorityQueryService ?? authorityQuery.Object,
            auditLineageResolver.Object,
            manifestHashService ?? SealedManifestHashTestSupport.CreateManifestHashService());
    }

    private sealed class FakeCloudResourceIdentityDirectory : ICloudResourceIdentityDirectory
    {
        public Dictionary<Guid, CloudResourceIdentityRecord> Records { get; } = [];

        public Task<CloudResourceIdentityRecord> UpsertOnSnapshotAsync(
            ScopeContext scope,
            CloudProvider provider,
            string externalResourceId,
            Guid snapshotId,
            string? resourceType,
            string? subscriptionOrAccountId,
            string? resourceGroupOrProject,
            string? region,
            string? displayName,
            CancellationToken cancellationToken = default)
            => throw new NotSupportedException();

        public Task<CloudResourceIdentityRecord?> TryGetByExternalIdAsync(
            ScopeContext scope,
            CloudProvider provider,
            string externalResourceId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<CloudResourceIdentityRecord?>(null);

        public Task<CloudResourceIdentityRecord?> TryGetByCloudResourceIdAsync(
            ScopeContext scope,
            Guid cloudResourceId,
            CancellationToken cancellationToken = default)
        {
            if (Records.TryGetValue(cloudResourceId, out CloudResourceIdentityRecord? record))
                return Task.FromResult<CloudResourceIdentityRecord?>(record);

            return Task.FromResult<CloudResourceIdentityRecord?>(null);
        }

        public Task UpdateResourceCloudResourceIdAsync(
            ScopeContext scope,
            Guid resourceRowId,
            Guid cloudResourceId,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<(IReadOnlyList<CloudResourceExplorerListItem> Items, int TotalCount)> ListForExplorerAsync(
            ScopeContext scope,
            string? namePrefix,
            string? resourceType,
            string? resourceGroup,
            CloudResourceExplorerWorkQueue workQueue,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
            => Task.FromResult<(IReadOnlyList<CloudResourceExplorerListItem> Items, int TotalCount)>(
                (Records.Values
                    .Where(row => row.TenantId == scope.TenantId)
                    .Select(row => new CloudResourceExplorerListItem
                    {
                        Identity = row,
                        WorkCounts = new CloudResourceExplorerWorkCounts(),
                    })
                    .ToList(),
                Records.Count));
    }

    private sealed class FakeOperationalSecurityFindingRepository : IOperationalSecurityFindingRepository
    {
        public Guid TenantId { get; set; }

        public List<OperationalSecurityFindingRecord> Findings { get; } = [];

        public Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
            Guid tenantId,
            CloudProvider provider,
            string sourceSystem,
            string sourceFindingId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<OperationalSecurityFindingRecord?>(null);

        public Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<OperationalSecurityFindingRecord?>(null);

        public Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
            Guid tenantId,
            OperationalSecurityFindingStatus? status,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<OperationalSecurityFindingRecord>>(
                Findings.Where(row => row.TenantId == tenantId).ToList());

        public Task<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
            Guid tenantId,
            Guid cloudResourceId,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            List<OperationalSecurityFindingRecord> filtered = Findings
                .Where(row => row.TenantId == tenantId && row.CloudResourceId == cloudResourceId)
                .OrderByDescending(row => row.LastObservedUtc)
                .ToList();

            int skip = PaginationDefaults.ToSkip(page, pageSize);
            List<OperationalSecurityFindingRecord> pageItems = filtered.Skip(skip).Take(pageSize).ToList();

            return Task.FromResult<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)>(
                (pageItems, filtered.Count));
        }

        public Task<IReadOnlyList<Guid>> ListFindingIdsByPathIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Guid>>([]);

        public Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<OperationalSecurityFindingMetadataRecord>>([]);

        public Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<OperationalSecurityFindingObservationRecord>>([]);

        public Task InsertAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord observation,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task UpdateAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord? observation,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }
}
