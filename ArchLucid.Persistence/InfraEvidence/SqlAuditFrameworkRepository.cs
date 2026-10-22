using System.Data;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlAuditFrameworkRepository(ISqlConnectionFactory connectionFactory) : IAuditFrameworkRepository
{
    public async Task<AuditFrameworkImportResult> ImportAsync(
        Guid tenantId,
        AuditFrameworkRecord framework,
        IReadOnlyList<AuditControlRecord> controls,
        IReadOnlyDictionary<Guid, IReadOnlyDictionary<string, string>> metadataByControlId,
        IReadOnlyList<AuditEvidenceRequirementRecord> requirements,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(framework);
        ArgumentNullException.ThrowIfNull(controls);
        ArgumentNullException.ThrowIfNull(metadataByControlId);

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        AuditFrameworkRecord? sameHash = await TryGetByVersionAndHashAsync(
            conn,
            tenantId,
            framework.Version,
            framework.ContentHashSha256,
            cancellationToken);

        if (sameHash is not null)
        {
            return new AuditFrameworkImportResult
            {
                Succeeded = true,
                WasIdempotentReplay = true,
                FrameworkId = sameHash.FrameworkId,
            };
        }

        AuditFrameworkRecord? sameVersionDifferentHash = await TryGetAnyByVersionAsync(
            conn,
            tenantId,
            framework.Version,
            cancellationToken);

        if (sameVersionDifferentHash is not null)
        {
            return new AuditFrameworkImportResult
            {
                Succeeded = false,
                ErrorCode = "VersionHashConflict",
                ErrorMessage = "An audit framework with the same version but a different content hash already exists.",
            };
        }

        if (conn is not SqlConnection sqlConn)
            throw new InvalidOperationException("Audit framework import requires a SqlConnection.");

        using IDbTransaction tx = sqlConn.BeginTransaction();

        try
        {
            const string insertFramework = """
                                           INSERT INTO dbo.AuditFrameworks
                                           (
                                               FrameworkId, TenantId, Name, Version, Publisher, EffectiveDate,
                                               SourceReference, Status, ContentHashSha256, SpecBlob, ImportedBy, CreatedUtc
                                           )
                                           VALUES
                                           (
                                               @FrameworkId, @TenantId, @Name, @Version, @Publisher, @EffectiveDate,
                                               @SourceReference, @Status, @ContentHashSha256, @SpecBlob, @ImportedBy, @CreatedUtc
                                           );
                                           """;

            await sqlConn.ExecuteAsync(
                new CommandDefinition(
                    insertFramework,
                    new
                    {
                        framework.FrameworkId,
                        framework.TenantId,
                        framework.Name,
                        framework.Version,
                        framework.Publisher,
                        framework.EffectiveDate,
                        framework.SourceReference,
                        Status = (int)framework.Status,
                        framework.ContentHashSha256,
                        framework.SpecBlob,
                        framework.ImportedBy,
                        framework.CreatedUtc,
                    },
                    transaction: tx,
                    commandTimeout: DapperCommandTimeoutSeconds.Report,
                    cancellationToken: cancellationToken));

            const string insertControl = """
                                         INSERT INTO dbo.AuditControls
                                         (
                                             ControlId, FrameworkId, TenantId, ControlNumber, Title, Description,
                                             Objective, Applicability, ControlType, ParentControlId, EvaluationGuidance
                                         )
                                         VALUES
                                         (
                                             @ControlId, @FrameworkId, @TenantId, @ControlNumber, @Title, @Description,
                                             @Objective, @Applicability, @ControlType, @ParentControlId, @EvaluationGuidance
                                         );
                                         """;

            const string insertMetadata = """
                                          INSERT INTO dbo.AuditControlMetadata
                                          (MetadataRowId, ControlId, TenantId, MetadataKey, MetadataValue)
                                          VALUES
                                          (@MetadataRowId, @ControlId, @TenantId, @MetadataKey, @MetadataValue);
                                          """;

            foreach (AuditControlRecord control in controls)
            {
                await sqlConn.ExecuteAsync(
                    new CommandDefinition(
                        insertControl,
                        control,
                        transaction: tx,
                        commandTimeout: DapperCommandTimeoutSeconds.Report,
                        cancellationToken: cancellationToken));

                if (!metadataByControlId.TryGetValue(control.ControlId, out IReadOnlyDictionary<string, string>? metadata))
                    continue;

                foreach (KeyValuePair<string, string> pair in metadata)
                {
                    await sqlConn.ExecuteAsync(
                        new CommandDefinition(
                            insertMetadata,
                            new
                            {
                                MetadataRowId = Guid.NewGuid(),
                                control.ControlId,
                                control.TenantId,
                                MetadataKey = pair.Key,
                                MetadataValue = pair.Value,
                            },
                            transaction: tx,
                            commandTimeout: DapperCommandTimeoutSeconds.Report,
                            cancellationToken: cancellationToken));
                }
            }

            if (requirements.Count > 0)
            {
                const string insertRequirement = """
                                                 INSERT INTO dbo.AuditEvidenceRequirements
                                                 (
                                                     RequirementId, ControlId, FrameworkId, TenantId, Name, Description,
                                                     EvidenceType, RequiredAzureScopes, RequiredResourceTypes, CollectionMethod,
                                                     Frequency, EvaluationMethod, ManualEvidenceAllowed, RequiredFreshness,
                                                     AutomationClass
                                                 )
                                                 VALUES
                                                 (
                                                     @RequirementId, @ControlId, @FrameworkId, @TenantId, @Name, @Description,
                                                     @EvidenceType, @RequiredAzureScopes, @RequiredResourceTypes, @CollectionMethod,
                                                     @Frequency, @EvaluationMethod, @ManualEvidenceAllowed, @RequiredFreshness,
                                                     @AutomationClass
                                                 );
                                                 """;

                foreach (AuditEvidenceRequirementRecord requirement in requirements)
                {
                    await sqlConn.ExecuteAsync(
                        new CommandDefinition(
                            insertRequirement,
                            new
                            {
                                requirement.RequirementId,
                                requirement.ControlId,
                                requirement.FrameworkId,
                                requirement.TenantId,
                                requirement.Name,
                                requirement.Description,
                                requirement.EvidenceType,
                                requirement.RequiredAzureScopes,
                                requirement.RequiredResourceTypes,
                                requirement.CollectionMethod,
                                requirement.Frequency,
                                requirement.EvaluationMethod,
                                requirement.ManualEvidenceAllowed,
                                requirement.RequiredFreshness,
                                AutomationClass = (int)requirement.AutomationClass,
                            },
                            transaction: tx,
                            commandTimeout: DapperCommandTimeoutSeconds.Report,
                            cancellationToken: cancellationToken));
                }
            }

            tx.Commit();

            return new AuditFrameworkImportResult
            {
                Succeeded = true,
                WasIdempotentReplay = false,
                FrameworkId = framework.FrameworkId,
            };
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task<AuditFrameworkRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid frameworkId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT TOP (1)
                               FrameworkId, TenantId, Name, Version, Publisher, EffectiveDate,
                               SourceReference, Status, ContentHashSha256, SpecBlob, ImportedBy, CreatedUtc
                           FROM dbo.AuditFrameworks
                           WHERE TenantId = @TenantId AND FrameworkId = @FrameworkId;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        FrameworkRow? row = await conn.QuerySingleOrDefaultAsync<FrameworkRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, FrameworkId = frameworkId }, cancellationToken: cancellationToken));

        return row is null ? null : MapFramework(row);
    }

    public async Task<IReadOnlyList<AuditControlRecord>> ListControlsAsync(
        Guid tenantId,
        Guid frameworkId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT ControlId, FrameworkId, TenantId, ControlNumber, Title, Description,
                                  Objective, Applicability, ControlType, ParentControlId, EvaluationGuidance
                           FROM dbo.AuditControls
                           WHERE TenantId = @TenantId AND FrameworkId = @FrameworkId
                           ORDER BY ControlNumber;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AuditControlRecord> rows = await conn.QueryAsync<AuditControlRecord>(
            new CommandDefinition(sql, new { TenantId = tenantId, FrameworkId = frameworkId }, cancellationToken: cancellationToken));

        return rows.ToList();
    }

    private static async Task<AuditFrameworkRecord?> TryGetByVersionAndHashAsync(
        IDbConnection conn,
        Guid tenantId,
        string version,
        byte[] contentHashSha256,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TOP (1)
                               FrameworkId, TenantId, Name, Version, Publisher, EffectiveDate,
                               SourceReference, Status, ContentHashSha256, SpecBlob, ImportedBy, CreatedUtc
                           FROM dbo.AuditFrameworks
                           WHERE TenantId = @TenantId AND Version = @Version AND ContentHashSha256 = @ContentHashSha256;
                           """;

        FrameworkRow? row = await conn.QuerySingleOrDefaultAsync<FrameworkRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, Version = version, ContentHashSha256 = contentHashSha256 },
                cancellationToken: cancellationToken));

        return row is null ? null : MapFramework(row);
    }

    private static async Task<AuditFrameworkRecord?> TryGetAnyByVersionAsync(
        IDbConnection conn,
        Guid tenantId,
        string version,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TOP (1)
                               FrameworkId, TenantId, Name, Version, Publisher, EffectiveDate,
                               SourceReference, Status, ContentHashSha256, SpecBlob, ImportedBy, CreatedUtc
                           FROM dbo.AuditFrameworks
                           WHERE TenantId = @TenantId AND Version = @Version;
                           """;

        FrameworkRow? row = await conn.QuerySingleOrDefaultAsync<FrameworkRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, Version = version }, cancellationToken: cancellationToken));

        return row is null ? null : MapFramework(row);
    }

    private static AuditFrameworkRecord MapFramework(FrameworkRow row) =>
        new()
        {
            FrameworkId = row.FrameworkId,
            TenantId = row.TenantId,
            Name = row.Name,
            Version = row.Version,
            Publisher = row.Publisher,
            EffectiveDate = row.EffectiveDate,
            SourceReference = row.SourceReference,
            Status = (AuditFrameworkStatus)row.Status,
            ContentHashSha256 = row.ContentHashSha256,
            SpecBlob = row.SpecBlob,
            ImportedBy = row.ImportedBy,
            CreatedUtc = row.CreatedUtc,
        };

    private sealed class FrameworkRow
    {
        public Guid FrameworkId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string Name
        {
            get;
            init;
        } = string.Empty;

        public string Version
        {
            get;
            init;
        } = string.Empty;

        public string? Publisher
        {
            get;
            init;
        }

        public DateOnly? EffectiveDate
        {
            get;
            init;
        }

        public string SourceReference
        {
            get;
            init;
        } = string.Empty;

        public int Status
        {
            get;
            init;
        }

        public byte[] ContentHashSha256
        {
            get;
            init;
        } = [];

        public byte[] SpecBlob
        {
            get;
            init;
        } = [];

        public string? ImportedBy
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }
    }
}
