using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlSecurityEvidencePathExplanationRepository(ISqlConnectionFactory connectionFactory)
    : ISecurityEvidencePathExplanationRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public async Task InsertAsync(SecurityEvidencePathExplanationRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           INSERT INTO dbo.SecurityEvidencePathExplanations
                           (
                               ExplanationId, PathId, TenantId, ExecutiveSummary,
                               BusinessImpactHypothesesJson, ProposedRemediationJson,
                               CitedEvidenceRefsJson, ProvenanceKind, SimulatorLabel, CreatedUtc
                           )
                           VALUES
                           (
                               @ExplanationId, @PathId, @TenantId, @ExecutiveSummary,
                               @BusinessImpactHypothesesJson, @ProposedRemediationJson,
                               @CitedEvidenceRefsJson, @ProvenanceKind, @SimulatorLabel, @CreatedUtc
                           );
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.ExplanationId,
                    record.PathId,
                    record.TenantId,
                    record.ExecutiveSummary,
                    BusinessImpactHypothesesJson = JsonSerializer.Serialize(record.BusinessImpactHypotheses, JsonOptions),
                    ProposedRemediationJson = JsonSerializer.Serialize(record.ProposedRemediation, JsonOptions),
                    CitedEvidenceRefsJson = JsonSerializer.Serialize(record.CitedEvidenceRefs, JsonOptions),
                    ProvenanceKind = (int)record.ProvenanceKind,
                    record.SimulatorLabel,
                    record.CreatedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<SecurityEvidencePathExplanationRecord>> ListByPathIdAsync(
        ScopeContext scope,
        Guid pathId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT ExplanationId, PathId, TenantId, ExecutiveSummary,
                                  BusinessImpactHypothesesJson, ProposedRemediationJson,
                                  CitedEvidenceRefsJson, ProvenanceKind, SimulatorLabel, CreatedUtc
                           FROM dbo.SecurityEvidencePathExplanations
                           WHERE TenantId = @TenantId AND PathId = @PathId
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ExplanationRow> rows = await conn.QueryAsync<ExplanationRow>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, PathId = pathId },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    private static SecurityEvidencePathExplanationRecord Map(ExplanationRow row)
    {
        IReadOnlyList<string> hypotheses = [];

        if (!string.IsNullOrWhiteSpace(row.BusinessImpactHypothesesJson))
        {
            hypotheses = JsonSerializer.Deserialize<List<string>>(row.BusinessImpactHypothesesJson, JsonOptions) ?? [];
        }

        SecurityEvidencePathProposedRemediation proposedRemediation = new();

        if (!string.IsNullOrWhiteSpace(row.ProposedRemediationJson))
        {
            proposedRemediation = JsonSerializer.Deserialize<SecurityEvidencePathProposedRemediation>(
                row.ProposedRemediationJson,
                JsonOptions) ?? new SecurityEvidencePathProposedRemediation();
        }

        IReadOnlyList<string> citedEvidenceRefs = [];

        if (!string.IsNullOrWhiteSpace(row.CitedEvidenceRefsJson))
        {
            citedEvidenceRefs = JsonSerializer.Deserialize<List<string>>(row.CitedEvidenceRefsJson, JsonOptions) ?? [];
        }

        return new SecurityEvidencePathExplanationRecord
        {
            ExplanationId = row.ExplanationId,
            PathId = row.PathId,
            TenantId = row.TenantId,
            ExecutiveSummary = row.ExecutiveSummary,
            BusinessImpactHypotheses = hypotheses,
            ProposedRemediation = proposedRemediation,
            CitedEvidenceRefs = citedEvidenceRefs,
            ProvenanceKind = (ProvenanceKind)row.ProvenanceKind,
            SimulatorLabel = row.SimulatorLabel,
            CreatedUtc = row.CreatedUtc,
        };
    }

    private sealed class ExplanationRow
    {
        public Guid ExplanationId
        {
            get;
            init;
        }

        public Guid PathId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string ExecutiveSummary
        {
            get;
            init;
        } = string.Empty;

        public string BusinessImpactHypothesesJson
        {
            get;
            init;
        } = string.Empty;

        public string ProposedRemediationJson
        {
            get;
            init;
        } = string.Empty;

        public string CitedEvidenceRefsJson
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
