using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.AzureExtractor;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence;

public sealed class AzureInventorySnapshotMaterializer(
    IAzureInventorySnapshotRepository snapshotRepository,
    ICloudResourceIdentityDirectory cloudResourceIdentityDirectory,
    IAzureInventorySnapshotPostMaterializeCoordinator postMaterializeCoordinator,
    ILogger<AzureInventorySnapshotMaterializer> logger) : IAzureInventorySnapshotMaterializer
{
    public async Task<AzureInventorySnapshotMaterializeResult> TryMaterializePackageAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid packageId,
        byte[] packageBytes,
        AzureInventoryCaptureMethod captureMethod,
        string? collectorVersion,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(packageBytes);

        try
        {
            AzureInventorySnapshotRecord? header =
                await snapshotRepository.TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

            if (header is null)
            {
                return new AzureInventorySnapshotMaterializeResult
                {
                    Succeeded = false,
                    ErrorMessage = "Snapshot header was not found in the current scope.",
                };
            }

            using MemoryStream zipStream = new(packageBytes, writable: false);
            zipStream.Position = 0;
            (AzureExtractorNormalizedManifest? manifest, _) =
                AzureExtractorManifestReader.TryReadNormalizedFromZip(zipStream);

            zipStream.Position = 0;
            AzureExtractorPackageInventoryReadResult inventory =
                AzureExtractorPackageInventoryReader.TryReadFromZip(zipStream);

            if (!inventory.Succeeded)
            {
                return new AzureInventorySnapshotMaterializeResult
                {
                    Succeeded = false,
                    CaptureStatus = AzureInventoryCaptureStatus.Failed,
                    ErrorMessage = inventory.Error ?? "Inventory read failed.",
                };
            }

            List<AzureInventoryResourceRecord> resources = [];
            List<AzureInventoryResourcePropertyWrite> properties = [];
            List<AzureInventoryTagWrite> tags = [];
            List<AzureInventoryUnknownResourceWrite> unknowns = [];
            List<AzureInventoryRoleAssignmentWrite> roleAssignments = [];
            List<AzureInventoryDiagnosticConfigurationWrite> diagnostics = [];
            List<AzureExtractorExtendedResourceRow> visibleInventoryRows = [];
            HashSet<string> privateLinkOnlyNicArmIds = AzureInventoryPrivateLinkOnlyNicCatalog.BuildOmittedNicArmIds(
                inventory.Resources,
                inventory.NetworkAssociations);

            foreach (AzureExtractorExtendedResourceRow row in inventory.Resources)
            {
                if (AzureInventoryNeverShowArmTypes.ShouldOmitResource(
                        row.ResourceType,
                        row.AzureResourceId,
                        privateLinkOnlyNicArmIds))
                {
                    continue;
                }

                visibleInventoryRows.Add(row);

                string normalizedArmId = ArmResourceIdNormalizer.Normalize(row.AzureResourceId);
                CloudResourceIdentityRecord identity = await cloudResourceIdentityDirectory.UpsertOnSnapshotAsync(
                    scope,
                    CloudProvider.Azure,
                    normalizedArmId,
                    snapshotId,
                    row.ResourceType,
                    header.SubscriptionId,
                    row.ResourceGroup,
                    row.Location,
                    row.Name,
                    cancellationToken);

                Guid resourceRowId = Guid.NewGuid();

                resources.Add(new AzureInventoryResourceRecord
                {
                    ResourceRowId = resourceRowId,
                    SnapshotId = snapshotId,
                    TenantId = scope.TenantId,
                    CloudResourceId = identity.CloudResourceId,
                    AzureResourceId = normalizedArmId,
                    ResourceType = row.ResourceType,
                    Region = row.Location,
                    ResourceGroup = row.ResourceGroup,
                    SubscriptionId = header.SubscriptionId,
                    ParentResourceId = TryGetParentArmId(normalizedArmId),
                    SourceEvidenceReference = AzureExtractorPackageZipEntryNames.Resources,
                });

                foreach (KeyValuePair<string, string> tag in row.Tags)
                {
                    tags.Add(new AzureInventoryTagWrite
                    {
                        ResourceRowId = resourceRowId,
                        TagKey = tag.Key,
                        TagValue = tag.Value,
                    });
                }

                foreach (KeyValuePair<string, string> property in row.Properties)
                {
                    bool redacted = AzureExtractorSensitivePropertyRedactor.IsSensitiveKey(property.Key);

                    properties.Add(new AzureInventoryResourcePropertyWrite
                    {
                        ResourceRowId = resourceRowId,
                        PropertyKey = property.Key,
                        PropertyValue = redacted
                            ? AzureExtractorSensitivePropertyRedactor.RedactValue(property.Value)
                            : property.Value,
                        IsRedacted = redacted,
                    });
                }

                if (row.IsUnknownType)
                {
                    unknowns.Add(new AzureInventoryUnknownResourceWrite
                    {
                        AzureResourceId = normalizedArmId,
                        ResourceType = row.ResourceType,
                        ResourceGroup = row.ResourceGroup,
                        CappedPropertiesJson = JsonSerializer.Serialize(row.Properties),
                        SourceEvidenceReference = AzureExtractorPackageZipEntryNames.Resources,
                    });
                }
            }

            foreach (JsonElement assignment in inventory.RoleAssignments)
            {
                string? scopeValue = TryReadJsonString(assignment, "scope");
                string? principalId = TryReadJsonString(assignment, "principalId");
                string? roleDefinitionId = TryReadJsonString(assignment, "roleDefinitionId");

                if (string.IsNullOrWhiteSpace(scopeValue)
                    || string.IsNullOrWhiteSpace(principalId)
                    || string.IsNullOrWhiteSpace(roleDefinitionId))
                {
                    continue;
                }

                roleAssignments.Add(new AzureInventoryRoleAssignmentWrite
                {
                    Scope = scopeValue,
                    PrincipalId = principalId,
                    RoleDefinitionId = roleDefinitionId,
                    SourceEvidenceReference = AzureExtractorPackageZipEntryNames.RoleAssignments,
                });
            }

            foreach (JsonElement diagnostic in inventory.DiagnosticSettings)
            {
                string? targetId = TryReadJsonString(diagnostic, "targetResourceId")
                                   ?? TryReadJsonString(diagnostic, "resourceId");
                string? name = TryReadJsonString(diagnostic, "name");
                string? workspaceId = TryReadJsonString(diagnostic, "workspaceId")
                                      ?? TryReadJsonString(diagnostic, "workspaceResourceId");

                if (string.IsNullOrWhiteSpace(targetId) || string.IsNullOrWhiteSpace(name))
                    continue;

                diagnostics.Add(new AzureInventoryDiagnosticConfigurationWrite
                {
                    TargetAzureResourceId = ArmResourceIdNormalizer.Normalize(targetId),
                    DiagnosticName = name,
                    WorkspaceResourceId = string.IsNullOrWhiteSpace(workspaceId)
                        ? null
                        : ArmResourceIdNormalizer.Normalize(workspaceId),
                    SourceEvidenceReference = AzureExtractorPackageZipEntryNames.DiagnosticSettings,
                });
            }

            IReadOnlyList<AzureInventoryDefenderSummaryWrite> defenderSummaries =
                DefenderSummaryCompanionMaterializer.Materialize(inventory.DefenderSummary);

            AzureInventorySecurityEdgeMaterializeResult securityEdges =
                AzureInventorySecurityEdgeMaterializer.Materialize(
                    visibleInventoryRows,
                    inventory.RoleAssignments,
                    inventory.NetworkAssociations,
                    inventory.PolicyAssignments,
                    inventory.DiagnosticSettings,
                    inventory.FederatedCredentials,
                    inventory.FederatedCredentialsFilePresent,
                    inventory.EntraGroupMemberships,
                    inventory.EntraGroupMembershipsFilePresent,
                    inventory.EffectiveNetworkControls,
                    inventory.EffectiveNetworkControlsFilePresent,
                    inventory.AdfLinkedServices,
                    inventory.AdfLinkedServicesFilePresent,
                    inventory.AdfDatasets,
                    inventory.AdfDatasetsFilePresent,
                    inventory.AdfPipelineFlows,
                    inventory.AdfPipelineFlowsFilePresent,
                    inventory.AdfTriggers,
                    inventory.AdfTriggersFilePresent,
                    inventory.AdfIntegrationRuntimes,
                    inventory.AdfIntegrationRuntimesFilePresent,
                    inventory.AdfDataflows,
                    inventory.AdfDataflowsFilePresent,
                    inventory.EventGridSubscriptions,
                    inventory.EventGridSubscriptionsFilePresent,
                    inventory.LogicAppConnections,
                    inventory.LogicAppConnectionsFilePresent,
                    inventory.MessagingAssociations,
                    inventory.MessagingAssociationsFilePresent,
                    inventory.PaasChildAssociations,
                    inventory.PaasChildAssociationsFilePresent,
                    inventory.ServiceConnectorLinks,
                    inventory.ServiceConnectorLinksFilePresent,
                    inventory.AppSettingHosts,
                    inventory.AppSettingHostsFilePresent,
                    inventory.DependencyObservations,
                    inventory.DependencyObservationsFilePresent,
                    inventory.SqlDatabasePrincipals,
                    inventory.SqlDatabasePrincipalsFilePresent,
                    inventory.RecoveryServicesProtectedItems,
                    inventory.RecoveryServicesProtectedItemsFilePresent);

            AppendRecoveryServicesVaultProtectedItemProperties(
                resources,
                properties,
                inventory.RecoveryServicesProtectedItems);

            HashSet<string> visibleArmIds = AzureInventoryVisibleSnapshotProjection.BuildVisibleArmIdSet(resources);
            List<AzureInventoryResourceRelationshipWrite> visibleRelationships =
                AzureInventoryVisibleSnapshotProjection.FilterVisibleRelationships(
                    securityEdges.Relationships,
                    visibleArmIds);

            byte[] contentHash = ComputeContentHash(resources, visibleRelationships);
            AzureInventoryCaptureStatus status = resources.Count == 0
                ? AzureInventoryCaptureStatus.Partial
                : AzureInventoryCaptureStatus.Succeeded;

            string? subscriptionId = null;
            string? subscriptionName = null;

            if (manifest is not null)
            {
                (subscriptionId, subscriptionName) = AzureInventorySnapshotSubscriptionIdentity.Resolve(
                    header.SubscriptionId,
                    header.SubscriptionName,
                    manifest.SubscriptionId,
                    manifest.SubscriptionName,
                    siblingSubscriptionName: null);
            }

            await snapshotRepository.MaterializeSnapshotAsync(
                scope,
                snapshotId,
                new AzureInventorySnapshotMaterializeWriteRequest
                {
                    CaptureStatus = status,
                    ResourceCount = resources.Count,
                    RelationshipCount = visibleRelationships.Count,
                    CompletenessScore = resources.Count == 0 ? 0m : 1.0m,
                    WarningCount = securityEdges.CompletenessWarnings.Count,
                    CompletenessWarningsJson = AzureInventorySnapshotCompletenessWarningsJson.Serialize(
                        securityEdges.CompletenessWarnings),
                    ErrorCount = 0,
                    ContentHashSha256 = contentHash,
                    CaptureMethod = captureMethod,
                    CollectorVersion = collectorVersion,
                    SubscriptionId = subscriptionId,
                    SubscriptionName = subscriptionName,
                    Resources = resources,
                    Properties = properties,
                    Relationships = visibleRelationships,
                    RoleAssignments = roleAssignments,
                    Tags = tags,
                    Diagnostics = diagnostics,
                    UnknownResources = unknowns,
                    DefenderSummaries = defenderSummaries,
                },
                cancellationToken);

            AzureInventorySnapshotRecord? materializedHeader =
                await snapshotRepository.TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

            if (materializedHeader is not null)
            {
                await postMaterializeCoordinator.OnSnapshotMaterializedAsync(
                    scope,
                    snapshotId,
                    materializedHeader.SubscriptionId,
                    cancellationToken);
            }

            return new AzureInventorySnapshotMaterializeResult
            {
                Succeeded = true,
                CaptureStatus = status,
                ResourceCount = resources.Count,
                RelationshipCount = visibleRelationships.Count,
                ContentHashSha256 = contentHash,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Azure inventory snapshot materialize failed for SnapshotId={SnapshotId}.", snapshotId);

            return new AzureInventorySnapshotMaterializeResult
            {
                Succeeded = false,
                CaptureStatus = AzureInventoryCaptureStatus.Failed,
                ErrorMessage = ex.Message,
            };
        }
    }

    private static byte[] ComputeContentHash(
        IReadOnlyList<AzureInventoryResourceRecord> resources,
        IReadOnlyList<AzureInventoryResourceRelationshipWrite> relationships)
    {
        StringBuilder builder = new();

        foreach (AzureInventoryResourceRecord resource in resources.OrderBy(r => r.AzureResourceId, StringComparer.Ordinal))
        {
            builder.Append(resource.AzureResourceId)
                .Append('|')
                .Append(resource.ResourceType)
                .Append(';');
        }

        foreach (AzureInventoryResourceRelationshipWrite relationship in relationships
                     .OrderBy(r => r.FromAzureResourceId, StringComparer.Ordinal)
                     .ThenBy(r => r.ToAzureResourceId, StringComparer.Ordinal))
        {
            builder.Append(relationship.FromAzureResourceId)
                .Append('>')
                .Append(relationship.ToAzureResourceId)
                .Append('|')
                .Append(relationship.RelationshipType)
                .Append('|')
                .Append((int)relationship.ProvenanceKind)
                .Append(';');
        }

        return SHA256.HashData(Encoding.UTF8.GetBytes(builder.ToString()));
    }

    private static void AppendRecoveryServicesVaultProtectedItemProperties(
        IReadOnlyList<AzureInventoryResourceRecord> resources,
        List<AzureInventoryResourcePropertyWrite> properties,
        IReadOnlyList<AzureInventoryRecoveryServicesProtectedItemRow> protectedItems)
    {
        if (protectedItems.Count == 0)
        {
            return;
        }

        Dictionary<string, Guid> vaultRowIdsByArmId = resources
            .Where(resource => string.Equals(
                resource.ResourceType,
                AzureInventoryRecoveryServices.VaultResourceType,
                StringComparison.OrdinalIgnoreCase))
            .GroupBy(resource => ArmResourceIdNormalizer.Normalize(resource.AzureResourceId), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First().ResourceRowId, StringComparer.OrdinalIgnoreCase);

        foreach (IGrouping<string, AzureInventoryRecoveryServicesProtectedItemRow> vaultGroup in protectedItems
                     .GroupBy(item => ArmResourceIdNormalizer.Normalize(item.VaultResourceId), StringComparer.OrdinalIgnoreCase))
        {
            if (!vaultRowIdsByArmId.TryGetValue(vaultGroup.Key, out Guid vaultRowId))
            {
                continue;
            }

            List<AzureInventoryRecoveryServicesProtectedItemRow> succeededItems = vaultGroup
                .Where(item => item.CollectionStatus.Equals(
                    AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                    StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (succeededItems.Count == 0)
            {
                continue;
            }

            properties.Add(new AzureInventoryResourcePropertyWrite
            {
                ResourceRowId = vaultRowId,
                PropertyKey = AzureInventoryRecoveryServices.ProtectedItemsPropertyKey,
                PropertyValue = JsonSerializer.Serialize(succeededItems),
                IsRedacted = false,
            });
        }
    }

    private static string? TryGetParentArmId(string normalizedArmId)
    {
        if (!ArmResourceIdNormalizer.TryGetParentResourceId(normalizedArmId, out string parentResourceId))
        {
            return null;
        }

        return parentResourceId;
    }

    private static string? TryReadJsonString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
            return null;

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
