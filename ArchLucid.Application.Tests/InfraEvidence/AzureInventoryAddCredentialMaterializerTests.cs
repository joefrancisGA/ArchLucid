using System.Text.Json;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryAddCredentialMaterializerTests
{
    private const string OwnerPrincipalId = "11111111-1111-1111-1111-111111111111";
    private const string HelpDeskPrincipalId = "22222222-2222-2222-2222-222222222222";
    private const string GraphPrivilegedPrincipalId = "33333333-3333-3333-3333-333333333333";
    private const string AppId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    private const string AppServicePrincipalId = "bbbbbbbb-cccc-dddd-eeee-ffffffffffff";
    private const string OtherAppServicePrincipalId = "cccccccc-dddd-eeee-ffff-000000000000";

    [Fact]
    public void Materialize_owner_reaches_only_owned_application_service_principal()
    {
        AzureInventorySecurityEdgeMaterializeResult result = Materialize(
            owners:
            [
                new AzureInventoryApplicationOwnerRow
                {
                    AppObjectId = "app-obj-1",
                    AppId = AppId,
                    OwnerId = OwnerPrincipalId,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
            registrations:
            [
                new AzureInventoryEntraApplicationRegistrationRow
                {
                    AppObjectId = "app-obj-1",
                    AppId = AppId,
                    ServicePrincipalObjectId = AppServicePrincipalId,
                },
                new AzureInventoryEntraApplicationRegistrationRow
                {
                    AppObjectId = "app-obj-2",
                    AppId = "other-app",
                    ServicePrincipalObjectId = OtherAppServicePrincipalId,
                },
            ]);

        AzureInventoryResourceRelationshipWrite edge = Assert.Single(
            result.Relationships,
            relationship => relationship.RelationshipType == GraphEdgeTypes.CanAddCredential);

        Assert.Equal(AzureInventoryPrincipalNodeId.Format(OwnerPrincipalId), edge.FromAzureResourceId);
        Assert.Equal(AzureInventoryPrincipalNodeId.Format(AppServicePrincipalId), edge.ToAzureResourceId);
        Assert.Contains("owner", edge.InferenceSource, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Materialize_cloud_application_administrator_at_root_reaches_every_collected_application()
    {
        AzureInventorySecurityEdgeMaterializeResult result = Materialize(
            directoryRoles:
            [
                new AzureInventoryDirectoryRoleAssignmentRow
                {
                    PrincipalId = HelpDeskPrincipalId,
                    RoleDefinitionTemplateId = AzureInventoryAddCredentialDirectoryRoleTemplates.CloudApplicationAdministrator,
                    DirectoryScopeId = "/",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
            registrations:
            [
                new AzureInventoryEntraApplicationRegistrationRow
                {
                    AppObjectId = "app-obj-1",
                    AppId = AppId,
                    ServicePrincipalObjectId = AppServicePrincipalId,
                },
                new AzureInventoryEntraApplicationRegistrationRow
                {
                    AppObjectId = "app-obj-2",
                    AppId = "other-app",
                    ServicePrincipalObjectId = OtherAppServicePrincipalId,
                },
            ]);

        List<AzureInventoryResourceRelationshipWrite> edges = result.Relationships
            .Where(relationship => relationship.RelationshipType == GraphEdgeTypes.CanAddCredential)
            .ToList();

        Assert.Equal(2, edges.Count);
        Assert.All(
            edges,
            edge => Assert.Equal(AzureInventoryPrincipalNodeId.Format(HelpDeskPrincipalId), edge.FromAzureResourceId));
    }

    [Fact]
    public void Materialize_administrative_unit_directory_role_emits_no_credential_hop()
    {
        AzureInventorySecurityEdgeMaterializeResult result = Materialize(
            directoryRoles:
            [
                new AzureInventoryDirectoryRoleAssignmentRow
                {
                    PrincipalId = HelpDeskPrincipalId,
                    RoleDefinitionTemplateId = AzureInventoryAddCredentialDirectoryRoleTemplates.CloudApplicationAdministrator,
                    DirectoryScopeId = "/administrativeUnits/au1",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
            registrations:
            [
                new AzureInventoryEntraApplicationRegistrationRow
                {
                    AppObjectId = "app-obj-1",
                    AppId = AppId,
                    ServicePrincipalObjectId = AppServicePrincipalId,
                },
            ]);

        Assert.DoesNotContain(
            result.Relationships,
            relationship => relationship.RelationshipType == GraphEdgeTypes.CanAddCredential);
    }

    [Fact]
    public void Materialize_unrelated_directory_role_emits_no_credential_hop()
    {
        AzureInventorySecurityEdgeMaterializeResult result = Materialize(
            directoryRoles:
            [
                new AzureInventoryDirectoryRoleAssignmentRow
                {
                    PrincipalId = HelpDeskPrincipalId,
                    RoleDefinitionTemplateId = "e8611ab8-c247-4fe8-91da-aa3116096c41",
                    DirectoryScopeId = "/",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
            registrations:
            [
                new AzureInventoryEntraApplicationRegistrationRow
                {
                    AppObjectId = "app-obj-1",
                    AppId = AppId,
                    ServicePrincipalObjectId = AppServicePrincipalId,
                },
            ]);

        Assert.DoesNotContain(
            result.Relationships,
            relationship => relationship.RelationshipType == GraphEdgeTypes.CanAddCredential);
    }

    [Fact]
    public void Materialize_application_readwrite_all_reaches_every_collected_application()
    {
        AzureInventorySecurityEdgeMaterializeResult result = Materialize(
            graphAppRoleAssignments:
            [
                new AzureInventoryGraphAppRoleAssignmentRow
                {
                    PrincipalId = GraphPrivilegedPrincipalId,
                    ResourceId = "graph-sp-object-id",
                    AppRoleId = AzureInventoryMicrosoftGraphWellKnown.ApplicationReadWriteAllAppRoleId,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
            registrations:
            [
                new AzureInventoryEntraApplicationRegistrationRow
                {
                    AppObjectId = "app-obj-1",
                    AppId = AppId,
                    ServicePrincipalObjectId = AppServicePrincipalId,
                },
                new AzureInventoryEntraApplicationRegistrationRow
                {
                    AppObjectId = "app-obj-2",
                    AppId = "other-app",
                    ServicePrincipalObjectId = OtherAppServicePrincipalId,
                },
            ]);

        List<AzureInventoryResourceRelationshipWrite> edges = result.Relationships
            .Where(relationship => relationship.RelationshipType == GraphEdgeTypes.CanAddCredential)
            .ToList();

        Assert.Equal(2, edges.Count);
        Assert.All(
            edges,
            edge => Assert.Equal(
                AzureInventoryPrincipalNodeId.Format(GraphPrivilegedPrincipalId),
                edge.FromAzureResourceId));
    }

    [Fact]
    public void Materialize_other_graph_app_role_emits_no_credential_hop()
    {
        AzureInventorySecurityEdgeMaterializeResult result = Materialize(
            graphAppRoleAssignments:
            [
                new AzureInventoryGraphAppRoleAssignmentRow
                {
                    PrincipalId = GraphPrivilegedPrincipalId,
                    ResourceId = "graph-sp-object-id",
                    AppRoleId = "00000000-0000-0000-0000-000000000099",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
            registrations:
            [
                new AzureInventoryEntraApplicationRegistrationRow
                {
                    AppObjectId = "app-obj-1",
                    AppId = AppId,
                    ServicePrincipalObjectId = AppServicePrincipalId,
                },
            ]);

        Assert.DoesNotContain(
            result.Relationships,
            relationship => relationship.RelationshipType == GraphEdgeTypes.CanAddCredential);
    }

    [Fact]
    public void Materialize_missing_application_owners_file_warns()
    {
        AzureInventorySecurityEdgeMaterializeResult result = Materialize(
            applicationOwnersFilePresent: false);

        Assert.Contains(
            result.CompletenessWarnings,
            warning => warning == SecurityEvidenceAddCredentialAdapterWarnings.MissingApplicationOwners);
    }

    [Fact]
    public void Materialize_eligible_directory_role_emits_no_credential_hop()
    {
        AzureInventorySecurityEdgeMaterializeResult result = Materialize(
            directoryRoles:
            [
                new AzureInventoryDirectoryRoleAssignmentRow
                {
                    PrincipalId = HelpDeskPrincipalId,
                    RoleDefinitionTemplateId = AzureInventoryAddCredentialDirectoryRoleTemplates.CloudApplicationAdministrator,
                    DirectoryScopeId = "/",
                    PimEligibilityKind = "eligible",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
            registrations:
            [
                new AzureInventoryEntraApplicationRegistrationRow
                {
                    AppObjectId = "app-obj-1",
                    AppId = AppId,
                    ServicePrincipalObjectId = AppServicePrincipalId,
                },
            ]);

        Assert.DoesNotContain(
            result.Relationships,
            relationship => relationship.RelationshipType == GraphEdgeTypes.CanAddCredential);
    }

    private static AzureInventorySecurityEdgeMaterializeResult Materialize(
        IReadOnlyList<AzureInventoryApplicationOwnerRow>? owners = null,
        IReadOnlyList<AzureInventoryDirectoryRoleAssignmentRow>? directoryRoles = null,
        IReadOnlyList<AzureInventoryEntraApplicationRegistrationRow>? registrations = null,
        IReadOnlyList<AzureInventoryGraphAppRoleAssignmentRow>? graphAppRoleAssignments = null,
        bool applicationOwnersFilePresent = true,
        bool directoryRoleAssignmentsFilePresent = true,
        bool graphAppRoleAssignmentsFilePresent = true)
    {
        return AzureInventorySecurityEdgeMaterializer.Materialize(
            [],
            [],
            [],
            [],
            [],
            [],
            federatedCredentialsFilePresent: true,
            [],
            entraGroupMembershipsFilePresent: true,
            [],
            effectiveNetworkControlsFilePresent: true,
            applicationOwners: owners ?? [],
            applicationOwnersFilePresent: applicationOwnersFilePresent,
            directoryRoleAssignments: directoryRoles ?? [],
            directoryRoleAssignmentsFilePresent: directoryRoleAssignmentsFilePresent,
            entraApplicationRegistrations: registrations ?? [],
            graphAppRoleAssignments: graphAppRoleAssignments ?? [],
            graphAppRoleAssignmentsFilePresent: graphAppRoleAssignmentsFilePresent);
    }
}
