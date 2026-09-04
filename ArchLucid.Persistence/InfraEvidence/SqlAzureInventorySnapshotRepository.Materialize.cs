using System.Data;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventorySnapshotRepository
{
    public async Task MaterializeSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        AzureInventorySnapshotMaterializeWriteRequest writeRequest,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(writeRequest);

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        if (conn is not SqlConnection sqlConn)
            throw new InvalidOperationException("Snapshot materialize requires SqlConnection.");

        using IDbTransaction tx = sqlConn.BeginTransaction();

        try
        {
            DateTime utcNow = TimeProvider.System.UtcNowDateTime();

            const string updateHeader = """
                                        UPDATE dbo.AzureInventorySnapshots
                                        SET CaptureStatus = @CaptureStatus,
                                            ResourceCount = @ResourceCount,
                                            RelationshipCount = @RelationshipCount,
                                            CompletenessScore = @CompletenessScore,
                                            WarningCount = @WarningCount,
                                            ErrorCount = @ErrorCount,
                                            ContentHashSha256 = @ContentHashSha256,
                                            CaptureMethod = @CaptureMethod,
                                            CollectorVersion = @CollectorVersion,
                                            UpdatedUtc = @UpdatedUtc
                                        WHERE TenantId = @TenantId
                                            AND SnapshotId = @SnapshotId;
                                        """;

            await sqlConn.ExecuteAsync(
                new CommandDefinition(
                    updateHeader,
                    new
                    {
                        scope.TenantId,
                        SnapshotId = snapshotId,
                        CaptureStatus = (int)writeRequest.CaptureStatus,
                        writeRequest.ResourceCount,
                        writeRequest.RelationshipCount,
                        writeRequest.CompletenessScore,
                        writeRequest.WarningCount,
                        writeRequest.ErrorCount,
                        writeRequest.ContentHashSha256,
                        CaptureMethod = (int)writeRequest.CaptureMethod,
                        writeRequest.CollectorVersion,
                        UpdatedUtc = utcNow,
                    },
                    transaction: tx,
                    commandTimeout: DapperCommandTimeoutSeconds.Report,
                    cancellationToken: cancellationToken));

            if (writeRequest.Resources.Count > 0)
            {
                const string insertResource = """
                                              INSERT INTO dbo.AzureInventoryResources
                                              (
                                                  ResourceRowId, SnapshotId, TenantId, CloudResourceId, AzureResourceId,
                                                  ResourceType, Region, ResourceGroup, SubscriptionId, ParentResourceId,
                                                  SourceEvidenceReference
                                              )
                                              VALUES
                                              (
                                                  @ResourceRowId, @SnapshotId, @TenantId, @CloudResourceId, @AzureResourceId,
                                                  @ResourceType, @Region, @ResourceGroup, @SubscriptionId, @ParentResourceId,
                                                  @SourceEvidenceReference
                                              );
                                              """;

                foreach (AzureInventoryResourceRecord resource in writeRequest.Resources)
                {
                    await sqlConn.ExecuteAsync(
                        new CommandDefinition(
                            insertResource,
                            new
                            {
                                resource.ResourceRowId,
                                resource.SnapshotId,
                                resource.TenantId,
                                resource.CloudResourceId,
                                resource.AzureResourceId,
                                resource.ResourceType,
                                resource.Region,
                                resource.ResourceGroup,
                                resource.SubscriptionId,
                                resource.ParentResourceId,
                                resource.SourceEvidenceReference,
                            },
                            transaction: tx,
                            commandTimeout: DapperCommandTimeoutSeconds.Report,
                            cancellationToken: cancellationToken));
                }
            }

            if (writeRequest.Properties.Count > 0)
            {
                const string insertProperty = """
                                              INSERT INTO dbo.AzureInventoryResourceProperties
                                              (PropertyRowId, SnapshotId, TenantId, ResourceRowId, PropertyKey, PropertyValue, IsRedacted)
                                              VALUES
                                              (@PropertyRowId, @SnapshotId, @TenantId, @ResourceRowId, @PropertyKey, @PropertyValue, @IsRedacted);
                                              """;

                foreach (AzureInventoryResourcePropertyWrite property in writeRequest.Properties)
                {
                    await sqlConn.ExecuteAsync(
                        new CommandDefinition(
                            insertProperty,
                            new
                            {
                                PropertyRowId = Guid.NewGuid(),
                                SnapshotId = snapshotId,
                                scope.TenantId,
                                property.ResourceRowId,
                                property.PropertyKey,
                                property.PropertyValue,
                                property.IsRedacted,
                            },
                            transaction: tx,
                            commandTimeout: DapperCommandTimeoutSeconds.Report,
                            cancellationToken: cancellationToken));
                }
            }

            if (writeRequest.Tags.Count > 0)
            {
                const string insertTag = """
                                         INSERT INTO dbo.AzureInventoryTags
                                         (TagRowId, SnapshotId, TenantId, ResourceRowId, TagKey, TagValue)
                                         VALUES
                                         (@TagRowId, @SnapshotId, @TenantId, @ResourceRowId, @TagKey, @TagValue);
                                         """;

                foreach (AzureInventoryTagWrite tag in writeRequest.Tags)
                {
                    await sqlConn.ExecuteAsync(
                        new CommandDefinition(
                            insertTag,
                            new
                            {
                                TagRowId = Guid.NewGuid(),
                                SnapshotId = snapshotId,
                                scope.TenantId,
                                tag.ResourceRowId,
                                tag.TagKey,
                                tag.TagValue,
                            },
                            transaction: tx,
                            commandTimeout: DapperCommandTimeoutSeconds.Report,
                            cancellationToken: cancellationToken));
                }
            }

            if (writeRequest.Relationships.Count > 0)
            {
                const string insertRelationship = """
                                                  INSERT INTO dbo.AzureInventoryResourceRelationships
                                                  (
                                                      RelationshipRowId, SnapshotId, TenantId, FromAzureResourceId,
                                                      ToAzureResourceId, RelationshipType, ProvenanceKind, Confidence, InferenceSource
                                                  )
                                                  VALUES
                                                  (
                                                      @RelationshipRowId, @SnapshotId, @TenantId, @FromAzureResourceId,
                                                      @ToAzureResourceId, @RelationshipType, @ProvenanceKind, @Confidence, @InferenceSource
                                                  );
                                                  """;

                foreach (AzureInventoryResourceRelationshipWrite relationship in writeRequest.Relationships)
                {
                    await sqlConn.ExecuteAsync(
                        new CommandDefinition(
                            insertRelationship,
                            new
                            {
                                RelationshipRowId = Guid.NewGuid(),
                                SnapshotId = snapshotId,
                                scope.TenantId,
                                relationship.FromAzureResourceId,
                                relationship.ToAzureResourceId,
                                relationship.RelationshipType,
                                ProvenanceKind = (int)relationship.ProvenanceKind,
                                relationship.Confidence,
                                relationship.InferenceSource,
                            },
                            transaction: tx,
                            commandTimeout: DapperCommandTimeoutSeconds.Report,
                            cancellationToken: cancellationToken));
                }
            }

            if (writeRequest.RoleAssignments.Count > 0)
            {
                const string insertRoleAssignment = """
                                                    INSERT INTO dbo.AzureInventoryRoleAssignments
                                                    (RoleAssignmentRowId, SnapshotId, TenantId, Scope, PrincipalId, RoleDefinitionId, SourceEvidenceReference)
                                                    VALUES
                                                    (@RoleAssignmentRowId, @SnapshotId, @TenantId, @Scope, @PrincipalId, @RoleDefinitionId, @SourceEvidenceReference);
                                                    """;

                foreach (AzureInventoryRoleAssignmentWrite roleAssignment in writeRequest.RoleAssignments)
                {
                    await sqlConn.ExecuteAsync(
                        new CommandDefinition(
                            insertRoleAssignment,
                            new
                            {
                                RoleAssignmentRowId = Guid.NewGuid(),
                                SnapshotId = snapshotId,
                                scope.TenantId,
                                roleAssignment.Scope,
                                roleAssignment.PrincipalId,
                                roleAssignment.RoleDefinitionId,
                                roleAssignment.SourceEvidenceReference,
                            },
                            transaction: tx,
                            commandTimeout: DapperCommandTimeoutSeconds.Report,
                            cancellationToken: cancellationToken));
                }
            }

            if (writeRequest.Diagnostics.Count > 0)
            {
                const string insertDiagnostic = """
                                                INSERT INTO dbo.AzureInventoryDiagnosticConfigurations
                                                (DiagnosticRowId, SnapshotId, TenantId, TargetAzureResourceId, DiagnosticName, WorkspaceResourceId, SourceEvidenceReference)
                                                VALUES
                                                (@DiagnosticRowId, @SnapshotId, @TenantId, @TargetAzureResourceId, @DiagnosticName, @WorkspaceResourceId, @SourceEvidenceReference);
                                                """;

                foreach (AzureInventoryDiagnosticConfigurationWrite diagnostic in writeRequest.Diagnostics)
                {
                    await sqlConn.ExecuteAsync(
                        new CommandDefinition(
                            insertDiagnostic,
                            new
                            {
                                DiagnosticRowId = Guid.NewGuid(),
                                SnapshotId = snapshotId,
                                scope.TenantId,
                                diagnostic.TargetAzureResourceId,
                                diagnostic.DiagnosticName,
                                diagnostic.WorkspaceResourceId,
                                diagnostic.SourceEvidenceReference,
                            },
                            transaction: tx,
                            commandTimeout: DapperCommandTimeoutSeconds.Report,
                            cancellationToken: cancellationToken));
                }
            }

            if (writeRequest.UnknownResources.Count > 0)
            {
                const string insertUnknown = """
                                             INSERT INTO dbo.AzureInventoryUnknownResources
                                             (UnknownResourceRowId, SnapshotId, TenantId, AzureResourceId, ResourceType, ResourceGroup, CappedPropertiesJson, SourceEvidenceReference)
                                             VALUES
                                             (@UnknownResourceRowId, @SnapshotId, @TenantId, @AzureResourceId, @ResourceType, @ResourceGroup, @CappedPropertiesJson, @SourceEvidenceReference);
                                             """;

                foreach (AzureInventoryUnknownResourceWrite unknown in writeRequest.UnknownResources)
                {
                    await sqlConn.ExecuteAsync(
                        new CommandDefinition(
                            insertUnknown,
                            new
                            {
                                UnknownResourceRowId = Guid.NewGuid(),
                                SnapshotId = snapshotId,
                                scope.TenantId,
                                unknown.AzureResourceId,
                                unknown.ResourceType,
                                unknown.ResourceGroup,
                                unknown.CappedPropertiesJson,
                                unknown.SourceEvidenceReference,
                            },
                            transaction: tx,
                            commandTimeout: DapperCommandTimeoutSeconds.Report,
                            cancellationToken: cancellationToken));
                }
            }

            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }
}
