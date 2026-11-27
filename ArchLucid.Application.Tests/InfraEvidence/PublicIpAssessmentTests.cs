using System.Text.Json;

using ArchLucid.Application;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Suite", "Core")]
public sealed class PublicIpAssessmentTests
{
    private const string Root = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/";
    private const string PublicIpType = "Microsoft.Network/publicIPAddresses";
    private const string NicType = "Microsoft.Network/networkInterfaces";
    private const string NsgType = "Microsoft.Network/networkSecurityGroups";

    private readonly ScopeContext _scope = new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };

    private readonly Guid _snapshotId = Guid.NewGuid();

    [Fact]
    public void Attached_and_unattached_addresses_are_distinct_and_not_live_observations()
    {
        AzureInventoryResourceRecord attached = Resource("publicIPAddresses/a", PublicIpType);
        AzureInventoryResourceRecord unattached = Resource("publicIPAddresses/b", PublicIpType);
        AzureInventoryResourceRecord nic = Resource("networkInterfaces/front", NicType);
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = Header(_scope, 3),
            Resources = [unattached, nic, attached],
            Properties = [Property(attached, "ipAddress", "203.0.113.12"), Property(unattached, "ipAddress", "2001:db8::12")],
            Relationships = [Attachment(attached, nic)],
        };

        PublicIpAssessmentResponse result = PublicIpAssessmentProjection.Build(snapshot, 1, 1, default);
        Assert.False(result.HasCaptureGaps);
        Assert.True(result.HasMore);
        Assert.Equal(2, result.TotalCount);
        Assert.Equal("notAssessed", result.ObservedReachability);
        PublicIpAssessmentItem first = Assert.Single(result.Items);
        Assert.Equal(attached.AzureResourceId, first.PublicIpResourceId);
        Assert.Equal("203.0.113.12", first.IpAddress);
        Assert.Equal("attached", first.AttachmentStatus);
        Assert.Equal(nic.AzureResourceId, first.AttachedResourceId);
        Assert.Equal("insufficientEvidence", first.IntendedReachability);
        Assert.Contains(new PublicIpAssessmentEvidence(attached.ResourceRowId, "inventoryPublicIpAttachment", "ObservedFact"), first.Evidence);

        PublicIpAssessmentItem second = Assert.Single(PublicIpAssessmentProjection.Build(snapshot, 2, 1, default).Items);
        Assert.Equal("2001:db8::12", second.IpAddress);
        Assert.Equal("noAttachmentObserved", second.AttachmentStatus);
        Assert.Equal("noAttachmentInEvidence", second.IntendedReachability);
        Assert.Null(second.AttachedResourceId);
    }

    [Fact]
    public void Restrictive_configuration_is_cited_without_claiming_effective_denial_or_connectivity()
    {
        AzureInventoryResourceRecord pip = Resource("publicIPAddresses/a", PublicIpType);
        AzureInventoryResourceRecord nic = Resource("networkInterfaces/front", NicType);
        AzureInventoryResourceRecord nsg = Resource("networkSecurityGroups/front", NsgType);
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = Header(_scope, 3),
            Resources = [pip, nic, nsg],
            Properties =
            [
                Property(nic, "networkSecurityGroup.id", nsg.AzureResourceId),
                Property(nsg, "securityRules", """
                    [{"name":"sensitive-rule-name","properties":{"direction":"Inbound","access":"Deny"}}]
                    """),
                Property(nic, "publicNetworkAccess", "Disabled"),
            ],
            Relationships = [Attachment(pip, nic)],
        };

        PublicIpAssessmentResponse result = PublicIpAssessmentProjection.Build(snapshot, 1, 10, default);
        PublicIpAssessmentItem item = Assert.Single(result.Items);
        Assert.Equal("attached", item.AttachmentStatus);
        Assert.Equal("restrictiveControlPresent", item.IntendedReachability);
        Assert.Equal("notAssessed", result.ObservedReachability);
        Assert.Contains(new PublicIpAssessmentEvidence(nsg.ResourceRowId, "inboundDenyRulePresent", "ObservedFact"), item.Evidence);
        Assert.Contains(new PublicIpAssessmentEvidence(nic.ResourceRowId, "publicNetworkAccessDisabled", "ObservedFact"), item.Evidence);
        Assert.DoesNotContain("sensitive-rule-name", JsonSerializer.Serialize(result), StringComparison.Ordinal);
    }

    [Theory]
    [InlineData(true, false)]
    [InlineData(false, true)]
    public void Partial_capture_or_missing_attachment_target_is_indeterminate(bool partial, bool unresolvedTarget)
    {
        AzureInventoryResourceRecord pip = Resource("publicIPAddresses/a", PublicIpType);
        AzureInventoryResourceRecord missing = Resource("networkInterfaces/missing", NicType);
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = Header(_scope, 1, partial ? AzureInventoryCaptureStatus.Partial : AzureInventoryCaptureStatus.Succeeded),
            Resources = [pip],
            Properties = [Property(pip, "ipAddress", "203.0.113.12")],
            Relationships = unresolvedTarget ? [Attachment(pip, missing)] : [],
        };

        PublicIpAssessmentItem item = Assert.Single(PublicIpAssessmentProjection.Build(snapshot, 1, 10, default).Items);
        Assert.Equal("unknown", item.AttachmentStatus);
        Assert.Null(item.AttachedResourceId);
        Assert.Equal("insufficientEvidence", item.IntendedReachability);
    }

    [Fact]
    public void Redacted_conflicting_or_unbound_fields_cannot_create_a_positive_claim()
    {
        AzureInventoryResourceRecord pip = Resource("publicIPAddresses/a", PublicIpType);
        AzureInventoryResourceRecord nic = Resource("networkInterfaces/front", NicType);
        AzureInventoryResourceRecord nsg = Resource("networkSecurityGroups/front", NsgType);
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = Header(_scope, 3),
            Resources = [pip, nic, nsg],
            Properties =
            [
                Property(pip, "ipAddress", "203.0.113.12"),
                Property(pip, "IPADDRESS", "203.0.113.13"),
                Property(nic, "publicNetworkAccess", "Disabled", redacted: true),
                Property(nic, "PUBLICNETWORKACCESS", "Disabled"),
                Property(nsg, "securityRules", """[{"direction":"Inbound","access":"Deny"}]"""),
            ],
            Relationships = [Attachment(pip, nic)],
        };

        PublicIpAssessmentItem item = Assert.Single(PublicIpAssessmentProjection.Build(snapshot, 1, 10, default).Items);
        Assert.Null(item.IpAddress);
        Assert.Equal("insufficientEvidence", item.IntendedReachability);
        Assert.DoesNotContain(item.Evidence, e => e.Kind is "ipAddress" or "publicNetworkAccessDisabled" or "inboundDenyRulePresent");
    }

    [Fact]
    public async Task Only_the_minimal_snapshot_slice_is_read_and_premium_and_foreign_data_are_excluded()
    {
        AzureInventoryResourceRecord pip = Resource("publicIPAddresses/a", PublicIpType);
        AzureInventoryResourceRecord foreign = Resource("publicIPAddresses/foreign-sentinel", PublicIpType, Guid.NewGuid());
        AzureInventoryResourceRecord nic = Resource("networkInterfaces/private-sentinel", NicType);
        AzureInventorySnapshotRecord header = Header(_scope, 3);
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = header,
            Resources = [pip, nic, foreign],
            Relationships = [Attachment(pip, nic, ProvenanceKind.HumanAssertion)],
            Properties =
            [
                Property(pip, "ipAddress", "203.0.113.12"),
                Property(pip, "arbitraryProperty", "property-sentinel"),
                Property(foreign, "ipAddress", "203.0.113.99"),
            ],
            Tags = [new() { ResourceRowId = pip.ResourceRowId, TagValue = "tag-sentinel" }],
            RoleAssignments = [new() { PrincipalId = "identity-sentinel" }],
            DefenderAssessments = [new() { DisplayName = "defender-sentinel" }],
        };

        Mock<IAzureInventorySnapshotRepository> repository = new(MockBehavior.Strict);
        repository.Setup(r => r.TryGetBySnapshotIdAsync(_scope, _snapshotId, default)).ReturnsAsync(header);
        repository.Setup(r => r.TryGetPublicIpAssessmentInventoryAsync(_scope, _snapshotId, default)).ReturnsAsync(snapshot);
        Mock<IArchitectureDiagramReconciliationRepository> reconciliations = new(MockBehavior.Strict);
        reconciliations.Setup(r => r.ListRunIdsBySnapshotAsync(_scope.TenantId, _snapshotId, default)).ReturnsAsync([]);
        PublicIpAssessmentQueryService service = Service(repository, reconciliations);

        PublicIpAssessmentResponse? result = await service.TryGetAsync(_scope, _snapshotId, 1, 10);
        Assert.NotNull(result);
        PublicIpAssessmentItem item = Assert.Single(result.Items);
        Assert.Equal(pip.AzureResourceId, item.PublicIpResourceId);
        Assert.Null(item.AttachedResourceId);
        Assert.Equal("unknown", item.AttachmentStatus);
        Assert.DoesNotContain("sentinel", JsonSerializer.Serialize(result), StringComparison.Ordinal);
        repository.Verify(r => r.TryGetPublicIpAssessmentInventoryAsync(_scope, _snapshotId, default), Times.Once);
        repository.Verify(r => r.TryGetBySnapshotIdAsync(_scope, _snapshotId, default), Times.Once);
        repository.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("tenant")]
    [InlineData("workspace")]
    [InlineData("project")]
    public async Task Foreign_scope_is_rejected_before_loading_inventory_or_run_data(string mismatch)
    {
        ScopeContext foreign = new()
        {
            TenantId = mismatch == "tenant" ? Guid.NewGuid() : _scope.TenantId,
            WorkspaceId = mismatch == "workspace" ? Guid.NewGuid() : _scope.WorkspaceId,
            ProjectId = mismatch == "project" ? Guid.NewGuid() : _scope.ProjectId,
        };
        Mock<IAzureInventorySnapshotRepository> repository = new(MockBehavior.Strict);
        repository.Setup(r => r.TryGetBySnapshotIdAsync(_scope, _snapshotId, default)).ReturnsAsync(Header(foreign, 0));
        Mock<IArchitectureDiagramReconciliationRepository> reconciliations = new(MockBehavior.Strict);

        Assert.Null(await Service(repository, reconciliations).TryGetAsync(_scope, _snapshotId, 1, 10));
        repository.Verify(r => r.TryGetBySnapshotIdAsync(_scope, _snapshotId, default), Times.Once);
        repository.VerifyNoOtherCalls();
        reconciliations.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task A_mismatched_detail_header_is_not_projected()
    {
        Mock<IAzureInventorySnapshotRepository> repository = new(MockBehavior.Strict);
        repository.Setup(r => r.TryGetBySnapshotIdAsync(_scope, _snapshotId, default)).ReturnsAsync(Header(_scope, 0));
        repository.Setup(r => r.TryGetPublicIpAssessmentInventoryAsync(_scope, _snapshotId, default))
            .ReturnsAsync(new AzureInventorySnapshotDetailReadModel { Header = Header(new ScopeContext(), 0) });
        Mock<IArchitectureDiagramReconciliationRepository> reconciliations = new(MockBehavior.Strict);
        reconciliations.Setup(r => r.ListRunIdsBySnapshotAsync(_scope.TenantId, _snapshotId, default)).ReturnsAsync([]);

        Assert.Null(await Service(repository, reconciliations).TryGetAsync(_scope, _snapshotId, 1, 10));
    }

    [Fact]
    public async Task Readable_unsealed_run_citation_stops_the_assessment_before_inventory_is_read()
    {
        Guid runId = Guid.NewGuid();
        Mock<IAzureInventorySnapshotRepository> repository = new(MockBehavior.Strict);
        repository.Setup(r => r.TryGetBySnapshotIdAsync(_scope, _snapshotId, default)).ReturnsAsync(Header(_scope, 0));
        Mock<IArchitectureDiagramReconciliationRepository> reconciliations = new(MockBehavior.Strict);
        reconciliations.Setup(r => r.ListRunIdsBySnapshotAsync(_scope.TenantId, _snapshotId, default)).ReturnsAsync([runId]);
        Mock<IInfraEvidenceRunReadAccess> runAccess = new(MockBehavior.Strict);
        runAccess.Setup(r => r.CanReadRunAsync(_scope, runId, default)).ReturnsAsync(true);
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        authority.Setup(r => r.GetRunDetailForManifestCompareAsync(_scope, runId, default))
            .ReturnsAsync((RunDetailDto?)null);
        PublicIpAssessmentQueryService service = new(repository.Object, reconciliations.Object, authority.Object,
            new Mock<IManifestHashService>(MockBehavior.Strict).Object, runAccess.Object);

        await Assert.ThrowsAsync<ConflictException>(() => service.TryGetAsync(_scope, _snapshotId, 1, 10));

        repository.Verify(r => r.TryGetBySnapshotIdAsync(_scope, _snapshotId, default), Times.Once);
        repository.VerifyNoOtherCalls();
    }

    private static PublicIpAssessmentQueryService Service(Mock<IAzureInventorySnapshotRepository> repository,
        Mock<IArchitectureDiagramReconciliationRepository> reconciliations) =>
        new(repository.Object, reconciliations.Object, new Mock<IAuthorityQueryService>(MockBehavior.Strict).Object,
            new Mock<IManifestHashService>(MockBehavior.Strict).Object,
            new Mock<IInfraEvidenceRunReadAccess>(MockBehavior.Strict).Object);

    private AzureInventorySnapshotRecord Header(ScopeContext scope, int count,
        AzureInventoryCaptureStatus status = AzureInventoryCaptureStatus.Succeeded) => new()
    {
        SnapshotId = _snapshotId,
        TenantId = scope.TenantId,
        WorkspaceId = scope.WorkspaceId,
        ProjectId = scope.ProjectId,
        CaptureStatus = status,
        ResourceCount = count,
        CapturedUtc = new DateTime(2026, 11, 26, 12, 0, 0, DateTimeKind.Utc),
    };

    private AzureInventoryResourceRecord Resource(string suffix, string type, Guid? tenant = null) => new()
    {
        ResourceRowId = Guid.NewGuid(),
        TenantId = tenant ?? _scope.TenantId,
        SnapshotId = _snapshotId,
        AzureResourceId = Root + suffix,
        ResourceType = type,
        SourceEvidenceReference = "raw-source-sentinel",
    };

    private static AzureInventoryResourcePropertyReadModel Property(
        AzureInventoryResourceRecord resource, string key, string value, bool redacted = false) =>
        new() { ResourceRowId = resource.ResourceRowId, PropertyKey = key, PropertyValue = value, IsRedacted = redacted };

    private static AzureInventoryResourceRelationshipReadModel Attachment(
        AzureInventoryResourceRecord pip, AzureInventoryResourceRecord target, ProvenanceKind provenance = ProvenanceKind.ObservedFact) =>
        new()
        {
            FromAzureResourceId = pip.AzureResourceId, ToAzureResourceId = target.AzureResourceId,
            RelationshipType = GraphEdgeTypes.Exposes, InferenceSource = GraphEdgeInferenceSources.InventoryPublicIp,
            ProvenanceKind = provenance,
        };
}
