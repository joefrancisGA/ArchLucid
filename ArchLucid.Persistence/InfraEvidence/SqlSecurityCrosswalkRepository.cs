using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlSecurityCrosswalkRepository(ISqlConnectionFactory connectionFactory)
    : ISecurityCrosswalkRepository
{
    public async Task<IReadOnlyList<SecurityCrosswalkMappingRecord>> InsertManyAsync(
        IReadOnlyList<SecurityCrosswalkMappingRecord> mappings,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(mappings);

        if (mappings.Count == 0)
            return [];

        const string sql = """
                           INSERT INTO dbo.SecurityCrosswalkMappings
                           (
                               MappingId, TenantId, SourceEndpointKind, SourceEndpointId, TargetEndpointKind,
                               TargetEndpointId, MappingType, Confidence, MappingSource, Version, Rationale,
                               HumanVerified, CreatedUtc, UpdatedUtc
                           )
                           VALUES
                           (
                               @MappingId, @TenantId, @SourceEndpointKind, @SourceEndpointId, @TargetEndpointKind,
                               @TargetEndpointId, @MappingType, @Confidence, @MappingSource, @Version, @Rationale,
                               @HumanVerified, @CreatedUtc, @UpdatedUtc
                           );
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        foreach (SecurityCrosswalkMappingRecord mapping in mappings)
        {
            await conn.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        mapping.MappingId,
                        mapping.TenantId,
                        SourceEndpointKind = (int)mapping.SourceEndpointKind,
                        mapping.SourceEndpointId,
                        TargetEndpointKind = (int)mapping.TargetEndpointKind,
                        mapping.TargetEndpointId,
                        MappingType = (int)mapping.MappingType,
                        mapping.Confidence,
                        MappingSource = (int)mapping.MappingSource,
                        mapping.Version,
                        mapping.Rationale,
                        mapping.HumanVerified,
                        mapping.CreatedUtc,
                        mapping.UpdatedUtc,
                    },
                    cancellationToken: cancellationToken));
        }

        return mappings;
    }

    public async Task<IReadOnlyList<SecurityCrosswalkMappingRecord>> ListBySourceAsync(
        Guid tenantId,
        SecurityCrosswalkEndpointKind sourceEndpointKind,
        string sourceEndpointId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT MappingId, TenantId, SourceEndpointKind, SourceEndpointId, TargetEndpointKind,
                                  TargetEndpointId, MappingType, Confidence, MappingSource, Version, Rationale,
                                  HumanVerified, CreatedUtc, UpdatedUtc
                           FROM dbo.SecurityCrosswalkMappings
                           WHERE TenantId = @TenantId
                               AND SourceEndpointKind = @SourceEndpointKind
                               AND SourceEndpointId = @SourceEndpointId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<Row> rows = await conn.QueryAsync<Row>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    SourceEndpointKind = (int)sourceEndpointKind,
                    SourceEndpointId = sourceEndpointId,
                },
                cancellationToken: cancellationToken));

        return rows
            .Select(row => new SecurityCrosswalkMappingRecord
            {
                MappingId = row.MappingId,
                TenantId = row.TenantId,
                SourceEndpointKind = (SecurityCrosswalkEndpointKind)row.SourceEndpointKind,
                SourceEndpointId = row.SourceEndpointId,
                TargetEndpointKind = (SecurityCrosswalkEndpointKind)row.TargetEndpointKind,
                TargetEndpointId = row.TargetEndpointId,
                MappingType = (SecurityCrosswalkMappingType)row.MappingType,
                Confidence = row.Confidence,
                MappingSource = (SecurityCrosswalkMappingSource)row.MappingSource,
                Version = row.Version,
                Rationale = row.Rationale,
                HumanVerified = row.HumanVerified,
                CreatedUtc = row.CreatedUtc,
                UpdatedUtc = row.UpdatedUtc,
            })
            .ToList();
    }

    private sealed class Row
    {
        public Guid MappingId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public int SourceEndpointKind
        {
            get;
            init;
        }

        public string SourceEndpointId
        {
            get;
            init;
        } = string.Empty;

        public int TargetEndpointKind
        {
            get;
            init;
        }

        public string TargetEndpointId
        {
            get;
            init;
        } = string.Empty;

        public int MappingType
        {
            get;
            init;
        }

        public decimal Confidence
        {
            get;
            init;
        }

        public int MappingSource
        {
            get;
            init;
        }

        public string Version
        {
            get;
            init;
        } = string.Empty;

        public string Rationale
        {
            get;
            init;
        } = string.Empty;

        public bool HumanVerified
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }
    }
}
