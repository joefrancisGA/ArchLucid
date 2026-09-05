using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class CloudResourceEvidenceHubServiceTests
{
    [Fact]
    public async Task TryGetHubAsync_unknown_cloud_resource_returns_not_found()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
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
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };

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
        ScopeContext scope = new() { TenantId = tenantId };

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

        CloudResourceEvidenceHubService hubService = CreateService(
            identityDirectory,
            operationalRepository: operationalRepository,
            authorityQueryService: authorityQuery.Object);

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

    private static CloudResourceEvidenceHubService CreateService(
        FakeCloudResourceIdentityDirectory identityDirectory,
        FakeOperationalSecurityFindingRepository? operationalRepository = null,
        IAuthorityQueryService? authorityQueryService = null)
    {
        operationalRepository ??= new FakeOperationalSecurityFindingRepository();

        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        Mock<IAzureInventoryDiffRepository> diffRepository = new();
        Mock<IAdvisoryTerraformRepresentationRepository> terraformRepository = new();
        Mock<IDiagramInfrastructureReconciliationService> diagramReconciliation = new();
        Mock<IRemediationInstanceRepository> remediationRepository = new();
        Mock<IAuthorityQueryService> authorityQuery = new();

        remediationRepository
            .Setup(repo => repo.ListByTenantAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        operationalRepository.Findings.ForEach(row =>
        {
            if (operationalRepository.TenantId == Guid.Empty)
                operationalRepository.TenantId = row.TenantId;
        });

        terraformRepository
            .Setup(repo => repo.ListMappingsBySnapshotIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return new CloudResourceEvidenceHubService(
            identityDirectory,
            snapshotRepository.Object,
            diffRepository.Object,
            terraformRepository.Object,
            diagramReconciliation.Object,
            operationalRepository,
            remediationRepository.Object,
            authorityQueryService ?? authorityQuery.Object);
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
