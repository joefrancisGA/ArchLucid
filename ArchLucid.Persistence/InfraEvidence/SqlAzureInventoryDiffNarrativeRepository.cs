using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlAzureInventoryDiffNarrativeRepository(ISqlConnectionFactory connectionFactory)
    : IAzureInventoryDiffNarrativeRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public async Task InsertAsync(AzureInventoryDiffNarrativeRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           INSERT INTO dbo.AzureInventoryDiffNarratives
                           (
                               NarrativeId, DiffId, TenantId, NarrativeKind, NarrativeText,
                               CitedChangeIdsJson, ProvenanceKind, SimulatorLabel, CreatedUtc
                           )
                           VALUES
                           (
                               @NarrativeId, @DiffId, @TenantId, @NarrativeKind, @NarrativeText,
                               @CitedChangeIdsJson, @ProvenanceKind, @SimulatorLabel, @CreatedUtc
                           );
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.NarrativeId,
                    record.DiffId,
                    record.TenantId,
                    NarrativeKind = (int)record.NarrativeKind,
                    record.NarrativeText,
                    CitedChangeIdsJson = JsonSerializer.Serialize(record.CitedChangeIds, JsonOptions),
                    ProvenanceKind = (int)record.ProvenanceKind,
                    record.SimulatorLabel,
                    record.CreatedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<AzureInventoryDiffNarrativeRecord>> ListByDiffIdAsync(
        ScopeContext scope,
        Guid diffId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT NarrativeId, DiffId, TenantId, NarrativeKind, NarrativeText,
                                  CitedChangeIdsJson, ProvenanceKind, SimulatorLabel, CreatedUtc
                           FROM dbo.AzureInventoryDiffNarratives
                           WHERE TenantId = @TenantId AND DiffId = @DiffId
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<NarrativeRow> rows = await conn.QueryAsync<NarrativeRow>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, DiffId = diffId },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    private static AzureInventoryDiffNarrativeRecord Map(NarrativeRow row)
    {
        IReadOnlyList<Guid> citedChangeIds = [];

        if (!string.IsNullOrWhiteSpace(row.CitedChangeIdsJson))
        {
            citedChangeIds = JsonSerializer.Deserialize<List<Guid>>(row.CitedChangeIdsJson, JsonOptions) ?? [];
        }

        return new AzureInventoryDiffNarrativeRecord
        {
            NarrativeId = row.NarrativeId,
            DiffId = row.DiffId,
            TenantId = row.TenantId,
            NarrativeKind = (AzureInventoryDiffNarrativeKind)row.NarrativeKind,
            NarrativeText = row.NarrativeText,
            CitedChangeIds = citedChangeIds,
            ProvenanceKind = (ProvenanceKind)row.ProvenanceKind,
            SimulatorLabel = row.SimulatorLabel,
            CreatedUtc = row.CreatedUtc,
        };
    }

    private sealed class NarrativeRow
    {
        public Guid NarrativeId
        {
            get;
            init;
        }

        public Guid DiffId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public int NarrativeKind
        {
            get;
            init;
        }

        public string NarrativeText
        {
            get;
            init;
        } = string.Empty;

        public string CitedChangeIdsJson
        {
            get;
            init;
        } = string.Empty;

        public int ProvenanceKind
        {
            get;
            init;
        }

        public string? SimulatorLabel
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
