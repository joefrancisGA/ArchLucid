using System.Security.Cryptography;

using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

/// <summary>
/// Strictly offline, partial snapshot reconstruction from an existing Azure extractor ZIP.
/// Reuses the production ZIP parser, security edge projector and question compiler.
/// It does NOT execute SQL-backed paths, effective policy packs or stored human dispositions.
/// </summary>
public static class SecureNowOfflineQuestionReplay
{
    public const long MaximumZipBytes = 128L * 1024 * 1024;

    public static SecureNowOfflineQuestionReplayResult Replay(byte[] packageBytes)
    {
        ArgumentNullException.ThrowIfNull(packageBytes);
        if (packageBytes.LongLength == 0 || packageBytes.LongLength > MaximumZipBytes)
            throw new InvalidDataException("Offline ZIP size is invalid or exceeds 128 MiB.");

        byte[] hash = SHA256.HashData(packageBytes);
        using MemoryStream stream = new(packageBytes, writable: false);

        AzureExtractorZipValidationResult validation = AzureExtractorPackageZipValidator.Validate(stream);
        if (!validation.IsValid)
            throw new InvalidDataException(
                validation.ErrorDetail ?? "The Azure extractor ZIP did not pass validation.");

        stream.Position = 0;
        (AzureExtractorNormalizedManifest? manifest, string? error) =
            AzureExtractorManifestReader.TryReadNormalizedFromZip(stream);
        if (manifest is null)
            throw new InvalidDataException(error ?? "Cannot read manifest.json.");

        if (string.IsNullOrWhiteSpace(manifest.SubscriptionId))
            throw new InvalidDataException(
                "Question replay currently requires one subscription per ZIP; management-group ZIPs are unsupported.");

        stream.Position = 0;
        AzureExtractorPackageInventoryReadResult inventory =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);
        if (!inventory.Succeeded)
            throw new InvalidDataException(inventory.Error ?? "Cannot read resources.json.");

        // Use the same production edge mapper and optional evidence families as snapshot materialization.
        AzureInventorySecurityEdgeMaterializeResult securityEdges =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                inventory.Resources,
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
                inventory.RecoveryServicesProtectedItemsFilePresent,
                inventory.ApplicationOwners,
                inventory.ApplicationOwnersFilePresent,
                inventory.DirectoryRoleAssignments,
                inventory.DirectoryRoleAssignmentsFilePresent,
                inventory.EntraApplicationRegistrations,
                inventory.GraphAppRoleAssignments,
                inventory.GraphAppRoleAssignmentsFilePresent);

        Guid snapshotId = new(hash.AsSpan(0, 16));
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("10000000-0000-4000-8000-000000000001"),
            WorkspaceId = Guid.Parse("20000000-0000-4000-8000-000000000002"),
            ProjectId = Guid.Parse("30000000-0000-4000-8000-000000000003"),
        };

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                SubscriptionId = manifest.SubscriptionId,
                CapturedUtc = manifest.CollectionTimestamp.UtcDateTime,
            },
            Resources = inventory.Resources.Select(row =>
            {
                string armId = ArmResourceIdNormalizer.Normalize(row.AzureResourceId);
                string? parentArmId =
                    ArmResourceIdNormalizer.TryGetParentResourceId(armId, out string parent)
                        ? parent : null;
                return new AzureInventoryResourceRecord
                {
                    SnapshotId = snapshotId,
                    TenantId = scope.TenantId,
                    ResourceRowId = new Guid(SHA256.HashData(
                        System.Text.Encoding.UTF8.GetBytes(armId)).AsSpan(0, 16)),
                    AzureResourceId = armId,
                    ResourceType = row.ResourceType,
                    SubscriptionId = manifest.SubscriptionId,
                    ParentResourceId = parentArmId,
                    SourceEvidenceReference = AzureExtractorPackageZipEntryNames.Resources,
                };
            }).ToList(),
            Relationships = securityEdges.Relationships.Select(edge =>
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = edge.FromAzureResourceId,
                    ToAzureResourceId = edge.ToAzureResourceId,
                    RelationshipType = edge.RelationshipType,
                    ProvenanceKind = edge.ProvenanceKind,
                    InferenceSource = edge.InferenceSource,
                }).ToList(),
        };

        IReadOnlyList<SecureNowDiagramQuestionCandidate> candidates =
            SecureNowDiagramQuestionCandidateBuilder.Build(snapshot);

        // Explicitly empty inputs: a ZIP alone cannot supply effective policy packs, stored
        // proposed connections, or operator dispositions. Never claim this is the full queue.
        IReadOnlyList<SecureNowQuestionRecord> questions = new SecureNowQuestionCompiler().Compile(
            scope, snapshot, [], candidates, [], []);

        return new SecureNowOfflineQuestionReplayResult
        {
            SubscriptionId = manifest.SubscriptionId,
            PackageSha256 = Convert.ToHexString(hash).ToLowerInvariant(),
            CaptureUtc = manifest.CollectionTimestamp.UtcDateTime,
            ResourceCount = snapshot.Resources.Count,
            RelationshipCount = snapshot.Relationships.Count,
            CompletenessWarningCount = securityEdges.CompletenessWarnings.Count,
            DiagramCandidates = candidates.Count,
            Questions = questions.OrderBy(q => q.QuestionKey, StringComparer.Ordinal)
                .ThenBy(q => q.ResourceId, StringComparer.Ordinal)
                .ToList(),
        };
    }
}

/// <summary>Diagnostic replay subset; never a full findings or policy-pack assessment.</summary>
public sealed class SecureNowOfflineQuestionReplayResult
{
    public string SubscriptionId { get; init; } = string.Empty;
    public string PackageSha256 { get; init; } = string.Empty;
    public DateTime CaptureUtc { get; init; }
    public int ResourceCount { get; init; }
    public int RelationshipCount { get; init; }
    public int CompletenessWarningCount { get; init; }
    public int DiagramCandidates { get; init; }
    public IReadOnlyList<SecureNowQuestionRecord> Questions { get; init; } = [];
}
