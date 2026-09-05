using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

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
            List<AzureInventoryResourceRelationshipWrite> relationships = [];
            List<AzureInventoryRoleAssignmentWrite> roleAssignments = [];
            List<AzureInventoryDiagnosticConfigurationWrite> diagnostics = [];
            Dictionary<string, Guid> resourceRowIdsByArmId = new(StringComparer.OrdinalIgnoreCase);

            foreach (AzureExtractorExtendedResourceRow row in inventory.Resources)
            {
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

                resourceRowIdsByArmId[normalizedArmId] = resourceRowId;

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

                string? parentArmId = TryGetParentArmId(normalizedArmId);

                if (!string.IsNullOrWhiteSpace(parentArmId))
                {
                    relationships.Add(new AzureInventoryResourceRelationshipWrite
                    {
                        FromAzureResourceId = parentArmId,
                        ToAzureResourceId = normalizedArmId,
                        RelationshipType = "contains",
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                        Confidence = 1.0m,
                    });
                }

                if (row.Properties.TryGetValue("privateEndpointConnections", out _))
                {
                    relationships.Add(new AzureInventoryResourceRelationshipWrite
                    {
                        FromAzureResourceId = normalizedArmId,
                        ToAzureResourceId = normalizedArmId,
                        RelationshipType = "privateEndpoint",
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                        Confidence = 1.0m,
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

                if (!string.IsNullOrWhiteSpace(workspaceId))
                {
                    relationships.Add(new AzureInventoryResourceRelationshipWrite
                    {
                        FromAzureResourceId = ArmResourceIdNormalizer.Normalize(targetId),
                        ToAzureResourceId = ArmResourceIdNormalizer.Normalize(workspaceId),
                        RelationshipType = "logsTo",
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                        Confidence = 1.0m,
                    });
                }
            }

            byte[] contentHash = ComputeContentHash(resources, relationships);
            AzureInventoryCaptureStatus status = resources.Count == 0
                ? AzureInventoryCaptureStatus.Partial
                : AzureInventoryCaptureStatus.Succeeded;

            await snapshotRepository.MaterializeSnapshotAsync(
                scope,
                snapshotId,
                new AzureInventorySnapshotMaterializeWriteRequest
                {
                    CaptureStatus = status,
                    ResourceCount = resources.Count,
                    RelationshipCount = relationships.Count,
                    CompletenessScore = resources.Count == 0 ? 0m : 1.0m,
                    WarningCount = 0,
                    ErrorCount = 0,
                    ContentHashSha256 = contentHash,
                    CaptureMethod = captureMethod,
                    CollectorVersion = collectorVersion,
                    Resources = resources,
                    Properties = properties,
                    Relationships = relationships,
                    RoleAssignments = roleAssignments,
                    Tags = tags,
                    Diagnostics = diagnostics,
                    UnknownResources = unknowns,
                },
                cancellationToken);

            return new AzureInventorySnapshotMaterializeResult
            {
                Succeeded = true,
                CaptureStatus = status,
                ResourceCount = resources.Count,
                RelationshipCount = relationships.Count,
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
                .Append(';');
        }

        return SHA256.HashData(Encoding.UTF8.GetBytes(builder.ToString()));
    }

    private static string? TryGetParentArmId(string normalizedArmId)
    {
        int lastSlash = normalizedArmId.LastIndexOf('/');

        if (lastSlash <= 0)
            return null;

        return normalizedArmId[..lastSlash];
    }

    private static string? TryReadJsonString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
            return null;

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
