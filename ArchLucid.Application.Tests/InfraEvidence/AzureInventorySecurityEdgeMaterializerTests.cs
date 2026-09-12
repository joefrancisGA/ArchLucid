using System.IO.Compression;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventorySecurityEdgeMaterializerTests
{
    [Fact]
    public void Materialize_role_assignment_emits_observed_has_role_and_derived_can_read()
    {
        const string scope =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string principalId = "11111111-1111-1111-1111-111111111111";
        const string readerRoleId =
            "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f60684581c14";

        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [],
                [ParseJson($$"""{"scope":"{{scope}}","principalId":"{{principalId}}","roleDefinitionId":"{{readerRoleId}}"}""")],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false);

        result.Relationships.Should().Contain(r =>
            r.RelationshipType == GraphEdgeTypes.HasRole
            && r.ProvenanceKind == ProvenanceKind.ObservedFact
            && r.FromAzureResourceId == AzureInventoryPrincipalNodeId.Format(principalId)
            && r.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(scope)
            && r.InferenceSource == GraphEdgeInferenceSources.InventoryRbacAssignment);

        result.Relationships.Should().Contain(r =>
            r.RelationshipType == GraphEdgeTypes.CanRead
            && r.ProvenanceKind == ProvenanceKind.DerivedFact
            && r.Confidence < 1.0m
            && r.InferenceSource == GraphEdgeInferenceSources.InventoryRbacDataPlaneMap);
    }

    [Fact]
    public void Materialize_unknown_role_adds_warning_and_skips_derived_edges()
    {
        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [],
                [ParseJson("""{"scope":"/subscriptions/sub","principalId":"22222222-2222-2222-2222-222222222222","roleDefinitionId":"/providers/Microsoft.Authorization/roleDefinitions/00000000-0000-0000-0000-000000000099"}""")],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false);

        result.Relationships.Should().ContainSingle(r => r.RelationshipType == GraphEdgeTypes.HasRole);
        result.Relationships.Should().NotContain(r => r.RelationshipType == GraphEdgeTypes.CanRead);
        result.Relationships.Should().NotContain(r => r.RelationshipType == GraphEdgeTypes.CanWrite);
        result.CompletenessWarnings.Should().ContainSingle(w => w.StartsWith("rbac-role-unmapped:", StringComparison.Ordinal));
    }

    [Fact]
    public void Materialize_missing_nsg_association_does_not_emit_allow_all_observed_fact()
    {
        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [],
                [],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false);

        result.Relationships.Should().NotContain(r =>
            r.ProvenanceKind == ProvenanceKind.ObservedFact
            && r.RelationshipType == GraphEdgeTypes.RoutesTo);
    }

    [Fact]
    public void Materialize_nsg_allow_rule_emits_routes_to_as_deterministic_inference()
    {
        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [],
                [],
                [ParseJson("""
                          {
                            "fromResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/app",
                            "toResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                            "associationType": "nsgAllowRule",
                            "ruleName": "Allow443"
                          }
                          """)],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false);

        result.Relationships.Should().ContainSingle(r =>
            r.RelationshipType == GraphEdgeTypes.RoutesTo
            && r.ProvenanceKind == ProvenanceKind.DeterministicInference
            && r.Confidence < 1.0m
            && r.InferenceSource == GraphEdgeInferenceSources.InventoryNsgAllowRule);
    }

    [Fact]
    public void Materialize_missing_federated_credentials_file_adds_completeness_warning_and_no_edges()
    {
        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [],
                [],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false);

        result.Relationships.Should().NotContain(r => r.RelationshipType == GraphEdgeTypes.FederatesAs);
        result.CompletenessWarnings.Should().ContainSingle(w =>
            w == SecurityEvidenceFederatedCredentialAdapterWarnings.MissingFile);
    }

    [Fact]
    public void Materialize_federated_credential_and_contributor_role_emits_federates_as_and_write_path_edges()
    {
        const string principalId = "33333333-3333-3333-3333-333333333333";
        const string scope =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string contributorRoleId =
            "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c";

        AzureInventoryFederatedCredentialRow credential = new()
        {
            Issuer = "https://token.actions.githubusercontent.com",
            Subject = "repo:example-org/example-repo:environment:production",
            PrincipalId = principalId,
            AppId = "44444444-4444-4444-4444-444444444444",
            ProvenanceKind = ProvenanceKind.ObservedFact,
        };

        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [],
                [ParseJson($$"""{"scope":"{{scope}}","principalId":"{{principalId}}","roleDefinitionId":"{{contributorRoleId}}"}""")],
                [],
                [],
                [],
                [credential],
                federatedCredentialsFilePresent: true,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false);

        result.Relationships.Should().Contain(r =>
            r.RelationshipType == GraphEdgeTypes.FederatesAs
            && r.FromAzureResourceId == credential.NodeId
            && r.ToAzureResourceId == credential.PrincipalNodeId
            && r.ProvenanceKind == ProvenanceKind.ObservedFact
            && r.InferenceSource == GraphEdgeInferenceSources.InventoryFederatedCredential);

        result.Relationships.Should().Contain(r =>
            r.RelationshipType == GraphEdgeTypes.CanWrite
            && r.FromAzureResourceId == credential.PrincipalNodeId
            && r.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(scope));
    }

    [Fact]
    public void Materialize_missing_entra_group_memberships_file_adds_completeness_warning_and_no_edges()
    {
        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [],
                [],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false);

        result.Relationships.Should().NotContain(r => r.RelationshipType == GraphEdgeTypes.MemberOf);
        result.CompletenessWarnings.Should().Contain(w =>
            w == SecurityEvidenceEntraGroupAdapterWarnings.MissingFile);
    }

    [Fact]
    public void Materialize_entra_group_membership_emits_member_of_edge()
    {
        const string memberId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        const string groupId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

        AzureInventoryEntraGroupMembershipRow membership = new()
        {
            MemberId = memberId,
            GroupId = groupId,
            ProvenanceKind = ProvenanceKind.ObservedFact,
        };

        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [],
                [],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [membership],
                entraGroupMembershipsFilePresent: true,
                [],
                effectiveNetworkControlsFilePresent: false);

        result.Relationships.Should().ContainSingle(r =>
            r.RelationshipType == GraphEdgeTypes.MemberOf
            && r.FromAzureResourceId == membership.MemberNodeId
            && r.ToAzureResourceId == membership.GroupNodeId
            && r.ProvenanceKind == ProvenanceKind.ObservedFact
            && r.InferenceSource == GraphEdgeInferenceSources.InventoryEntraGroupMembership);
    }

    [Fact]
    public void Materialize_catalog_associations_emit_vm_nic_subnet_nsg_and_peering_edges()
    {
        const string vm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
        const string nic =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1";
        const string subnet =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/app";
        const string nsg =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg1";
        const string remoteVnet =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet2";

        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [],
                [],
                [
                    ParseJson($$"""{"fromResourceId":"{{vm}}","toResourceId":"{{nic}}","associationType":"vmToNic"}"""),
                    ParseJson($$"""{"fromResourceId":"{{subnet}}","toResourceId":"{{nsg}}","associationType":"subnetToNsg"}"""),
                    ParseJson($$"""{"fromResourceId":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1","toResourceId":"{{remoteVnet}}","associationType":"vnetPeering"}"""),
                ],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false);

        result.Relationships.Should().Contain(r =>
            r.RelationshipType == GraphEdgeTypes.ConnectsTo
            && r.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(vm)
            && r.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(nic)
            && r.InferenceSource == GraphEdgeInferenceSources.InventoryVmNic);

        result.Relationships.Should().Contain(r =>
            r.RelationshipType == GraphEdgeTypes.AppliesTo
            && r.InferenceSource == GraphEdgeInferenceSources.InventorySubnetNsg);

        result.Relationships.Should().Contain(r =>
            r.RelationshipType == GraphEdgeTypes.PeersWith
            && r.InferenceSource == GraphEdgeInferenceSources.InventoryVnetPeering);
    }

    [Fact]
    public void Materialize_unknown_association_type_adds_warning_and_skips_edge()
    {
        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [],
                [],
                [ParseJson("""
                          {
                            "fromResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1",
                            "toResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1",
                            "associationType": "notARealType"
                          }
                          """)],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false);

        result.Relationships.Should().BeEmpty();
        result.CompletenessWarnings.Should().Contain(w =>
            w == $"{AzureInventoryRelationshipCompletenessWarningCodes.AssociationTypeUnmappedPrefix}notARealType");
    }

    [Fact]
    public void Materialize_vms_without_vm_to_nic_adds_completeness_warning()
    {
        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [
                    new AzureExtractorExtendedResourceRow
                    {
                        AzureResourceId =
                            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1",
                        ResourceType = "Microsoft.Compute/virtualMachines",
                        Name = "vm1",
                    },
                ],
                [],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false);

        result.CompletenessWarnings.Should().Contain(
            AzureInventoryRelationshipCompletenessWarningCodes.ArgVmNicMissing);
    }

    [Fact]
    public void Materialize_pim_eligibility_unknown_skips_derived_can_read_and_marks_has_role()
    {
        const string scope =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string principalId = "11111111-1111-1111-1111-111111111111";
        const string readerRoleId =
            "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f60684581c14";

        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [],
                [ParseJson($$"""{"scope":"{{scope}}","principalId":"{{principalId}}","roleDefinitionId":"{{readerRoleId}}","pimEligibilityKind":"unknown"}""")],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false);

        result.Relationships.Should().ContainSingle(r =>
            r.RelationshipType == GraphEdgeTypes.HasRole
            && r.InferenceSource == GraphEdgeInferenceSources.PimEligibilityUnknown
            && r.ProvenanceKind == ProvenanceKind.DeterministicInference);
        result.Relationships.Should().NotContain(r => r.RelationshipType == GraphEdgeTypes.CanRead);
        result.Relationships.Should().NotContain(r => r.RelationshipType == GraphEdgeTypes.CanWrite);
    }

    [Fact]
    public void Materialize_effective_nsg_emits_applies_to_as_deterministic_inference()
    {
        const string nic =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1";
        const string nsg =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg1";

        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [],
                [],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [
                    new AzureInventoryEffectiveNetworkControlRow
                    {
                        NicResourceId = nic,
                        Kind = AzureInventoryEffectiveNetworkControlKind.EffectiveNsg,
                        CollectionStatus = AzureInventoryEffectiveNetworkControlCollectionStatus.Succeeded,
                        EffectiveResourceId = nsg,
                        PayloadHashSha256 = "abc123",
                    },
                ],
                effectiveNetworkControlsFilePresent: true);

        result.Relationships.Should().ContainSingle(r =>
            r.RelationshipType == GraphEdgeTypes.AppliesTo
            && r.ProvenanceKind == ProvenanceKind.DeterministicInference
            && r.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(nic)
            && r.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(nsg)
            && r.InferenceSource == GraphEdgeInferenceSources.InventoryEffectiveNsg);
        result.Relationships.Should().NotContain(r => r.ProvenanceKind == ProvenanceKind.ObservedFact);
    }

    [Fact]
    public void Materialize_skipped_effective_control_does_not_emit_edge()
    {
        const string nic =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1";

        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [],
                [],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [
                    new AzureInventoryEffectiveNetworkControlRow
                    {
                        NicResourceId = nic,
                        Kind = AzureInventoryEffectiveNetworkControlKind.EffectiveNsg,
                        CollectionStatus = AzureInventoryEffectiveNetworkControlCollectionStatus.Skipped,
                    },
                ],
                effectiveNetworkControlsFilePresent: true);

        result.Relationships.Should().BeEmpty();
    }

    [Fact]
    public void Materialize_absent_effective_controls_file_does_not_emit_edges()
    {
        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [],
                [],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [
                    new AzureInventoryEffectiveNetworkControlRow
                    {
                        NicResourceId =
                            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1",
                        Kind = AzureInventoryEffectiveNetworkControlKind.EffectiveNsg,
                        CollectionStatus = AzureInventoryEffectiveNetworkControlCollectionStatus.Succeeded,
                        EffectiveResourceId =
                            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg1",
                    },
                ],
                effectiveNetworkControlsFilePresent: false);

        result.Relationships.Should().BeEmpty();
    }

    private static JsonElement ParseJson(string json)
    {
        using JsonDocument document = JsonDocument.Parse(json);

        return document.RootElement.Clone();
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventorySnapshotMaterializerSecurityEdgeIntegrationTests
{
    [Fact]
    public async Task TryMaterializePackageAsync_fixture_with_mi_role_and_public_ip_produces_labeled_edges()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid snapshotId = Guid.NewGuid();
        Guid packageId = Guid.NewGuid();

        AzureInventorySnapshotMaterializeWriteRequest? captured = null;
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = CreateSnapshotRepository(
            scope,
            snapshotId,
            request => captured = request);

        Mock<ICloudResourceIdentityDirectory> identityDirectory = CreateIdentityDirectory(scope, snapshotId);

        const string storageAccount =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string publicIp =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip1";
        const string principalId = "33333333-3333-3333-3333-333333333333";
        const string blobReaderRole =
            "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/2a2b9908-6ea1-4ae2-8e65-a410df84e7dd";

        string resourcesJson = """
                               [
                                 {
                                   "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                                   "resourceType": "Microsoft.Storage/storageAccounts",
                                   "name": "sa1",
                                   "properties": {
                                     "identity": "{\"userAssignedIdentities\":{\"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/worker\":{}}}"
                                   }
                                 },
                                 {
                                   "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip1",
                                   "resourceType": "Microsoft.Network/publicIPAddresses",
                                   "name": "pip1",
                                   "properties": {
                                     "ipConfiguration.id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip1/ipConfigurations/ipconfig1"
                                   }
                                 }
                               ]
                               """;

        byte[] zipBytes = BuildSecurityFixtureZip(
            resourcesJson: resourcesJson,
            roleAssignmentsJson: $$"""
                                   [
                                     {
                                       "scope": "{{storageAccount}}",
                                       "principalId": "{{principalId}}",
                                       "roleDefinitionId": "{{blobReaderRole}}"
                                     }
                                   ]
                                   """,
            networkAssociationsJson: $$"""
                                       [
                                         {
                                           "fromResourceId": "{{publicIp}}",
                                           "toResourceId": "{{storageAccount}}",
                                           "associationType": "publicIpToNic"
                                         }
                                       ]
                                       """);

        AzureInventorySnapshotMaterializer sut = new(
            snapshotRepository.Object,
            identityDirectory.Object,
            CreateNoOpPostMaterializeCoordinator(),
            NullLogger<AzureInventorySnapshotMaterializer>.Instance);

        AzureInventorySnapshotMaterializeResult result = await sut.TryMaterializePackageAsync(
            scope,
            snapshotId,
            packageId,
            zipBytes,
            AzureInventoryCaptureMethod.CustomerScript,
            "0.4.0",
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        captured.Should().NotBeNull();
        captured!.UnknownResources.Should().BeEmpty();
        captured.Relationships.Should().Contain(r =>
            r.RelationshipType == GraphEdgeTypes.UsesIdentity
            && r.ProvenanceKind == ProvenanceKind.ObservedFact);
        captured.Relationships.Should().Contain(r =>
            r.RelationshipType == GraphEdgeTypes.HasRole
            && r.ProvenanceKind == ProvenanceKind.ObservedFact);
        captured.Relationships.Should().Contain(r =>
            r.RelationshipType == GraphEdgeTypes.CanRead
            && r.ProvenanceKind == ProvenanceKind.DerivedFact);
        captured.Relationships.Should().Contain(r =>
            r.RelationshipType == GraphEdgeTypes.Exposes
            && r.ProvenanceKind == ProvenanceKind.ObservedFact);
    }

    [Fact]
    public async Task TryMaterializePackageAsync_keeps_unknown_resource_type_in_unknowns()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid snapshotId = Guid.NewGuid();
        Guid packageId = Guid.NewGuid();

        AzureInventorySnapshotMaterializeWriteRequest? captured = null;
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = CreateSnapshotRepository(
            scope,
            snapshotId,
            request => captured = request);

        Mock<ICloudResourceIdentityDirectory> identityDirectory = CreateIdentityDirectory(scope, snapshotId);

        byte[] zipBytes = BuildSecurityFixtureZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Unknown/widget1",
                "resourceType": "Microsoft.Unknown/widget",
                "name": "widget1",
                "isUnknownType": true,
                "properties": { "foo": "bar" }
              }
            ]
            """,
            "[]",
            "[]");

        AzureInventorySnapshotMaterializer sut = new(
            snapshotRepository.Object,
            identityDirectory.Object,
            CreateNoOpPostMaterializeCoordinator(),
            NullLogger<AzureInventorySnapshotMaterializer>.Instance);

        await sut.TryMaterializePackageAsync(
            scope,
            snapshotId,
            packageId,
            zipBytes,
            AzureInventoryCaptureMethod.HostedReader,
            "hosted-1",
            CancellationToken.None);

        captured!.UnknownResources.Should().ContainSingle(u =>
            u.ResourceType == "Microsoft.Unknown/widget");
    }

    private static Mock<IAzureInventorySnapshotRepository> CreateSnapshotRepository(
        ScopeContext scope,
        Guid snapshotId,
        Action<AzureInventorySnapshotMaterializeWriteRequest> onMaterialize)
    {
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();

        snapshotRepository
            .Setup(r => r.TryGetBySnapshotIdAsync(scope, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = scope.TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Pending,
            });

        snapshotRepository
            .Setup(r => r.MaterializeSnapshotAsync(
                scope,
                snapshotId,
                It.IsAny<AzureInventorySnapshotMaterializeWriteRequest>(),
                It.IsAny<CancellationToken>()))
            .Callback<ScopeContext, Guid, AzureInventorySnapshotMaterializeWriteRequest, CancellationToken>(
                (_, _, request, _) => onMaterialize(request))
            .Returns(Task.CompletedTask);

        return snapshotRepository;
    }

    private static IAzureInventorySnapshotPostMaterializeCoordinator CreateNoOpPostMaterializeCoordinator()
    {
        Mock<IAzureInventorySnapshotPostMaterializeCoordinator> coordinator = new();
        coordinator
            .Setup(c => c.OnSnapshotMaterializedAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return coordinator.Object;
    }

    private static Mock<ICloudResourceIdentityDirectory> CreateIdentityDirectory(ScopeContext scope, Guid snapshotId)
    {
        Mock<ICloudResourceIdentityDirectory> identityDirectory = new();

        identityDirectory
            .Setup(d => d.UpsertOnSnapshotAsync(
                scope,
                CloudProvider.Azure,
                It.IsAny<string>(),
                snapshotId,
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, CloudProvider _, string externalId, Guid _, string? _, string? _, string? _, string? _, string? _, CancellationToken _) =>
                new CloudResourceIdentityRecord
                {
                    CloudResourceId = Guid.NewGuid(),
                    ExternalResourceIdNormalized = externalId,
                    Provider = CloudProvider.Azure,
                });

        return identityDirectory;
    }

    private static byte[] BuildSecurityFixtureZip(
        string resourcesJson,
        string roleAssignmentsJson,
        string networkAssociationsJson)
    {
        using MemoryStream ms = new();

        using (ZipArchive archive = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            WriteZipEntry(archive, AzureExtractorPackageZipEntryNames.Resources, resourcesJson);
            WriteZipEntry(archive, AzureExtractorPackageZipEntryNames.RoleAssignments, roleAssignmentsJson);
            WriteZipEntry(archive, AzureExtractorPackageZipEntryNames.NetworkAssociations, networkAssociationsJson);
            WriteZipEntry(archive, AzureExtractorPackageZipEntryNames.PolicyAssignments, "[]");
            WriteZipEntry(archive, AzureExtractorPackageZipEntryNames.DiagnosticSettings, "[]");
            WriteZipEntry(archive, AzureExtractorPackageZipEntryNames.EntraGroupMemberships, "[]");
        }

        return ms.ToArray();
    }

    private static void WriteZipEntry(ZipArchive archive, string entryName, string contents)
    {
        ZipArchiveEntry entry = archive.CreateEntry(entryName);
        using StreamWriter writer = new(entry.Open(), Encoding.UTF8);
        writer.Write(contents);
    }
}
