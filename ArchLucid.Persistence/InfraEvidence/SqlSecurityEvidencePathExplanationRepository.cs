using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
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
                               CitedEvidenceRefsJson, ProvenanceKind, SimulatorLabel, ModelOutputRejection,
                               InventoryFalsificationJson, CreatedUtc
                           )
                           VALUES
                           (
                               @ExplanationId, @PathId, @TenantId, @ExecutiveSummary,
                               @BusinessImpactHypothesesJson, @ProposedRemediationJson,
                               @CitedEvidenceRefsJson, @ProvenanceKind, @SimulatorLabel, @ModelOutputRejection,
                               @InventoryFalsificationJson, @CreatedUtc
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
                    record.ModelOutputRejection,
                    InventoryFalsificationJson = record.InventoryFalsification is null
                        ? null : JsonSerializer.Serialize(record.InventoryFalsification, JsonOptions),
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
                           SELECT e.ExplanationId, e.PathId, e.TenantId, e.ExecutiveSummary,
                                  e.BusinessImpactHypothesesJson, e.ProposedRemediationJson,
                                  e.CitedEvidenceRefsJson, e.ProvenanceKind, e.SimulatorLabel, e.ModelOutputRejection,
                                  e.InventoryFalsificationJson, e.CreatedUtc, p.SnapshotId AS PathSnapshotId
                           FROM dbo.SecurityEvidencePathExplanations AS e
                           INNER JOIN dbo.SecurityEvidencePaths AS p ON p.PathId = e.PathId AND p.TenantId = e.TenantId
                           WHERE e.TenantId = @TenantId AND e.PathId = @PathId
                             AND p.WorkspaceId = @WorkspaceId AND p.ProjectId = @ProjectId
                           ORDER BY e.CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ExplanationRow> rows = await conn.QueryAsync<ExplanationRow>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, PathId = pathId },
                cancellationToken: cancellationToken));

        return rows.Select(row => Map(row, scope)).ToList();
    }

    public async Task<IReadOnlyList<SecurityEvidencePathVerificationRecord>> ListLatestVerificationByPathsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<Guid> pathIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(pathIds);
        cancellationToken.ThrowIfCancellationRequested();
        if (snapshotId == Guid.Empty || pathIds.Count == 0)
            return [];

        // Select the latest explanation first. A newer legacy, invalid or absent observation is
        // unknown, not permission to fall back to an older successful verification.
        const string sql = """
                           SELECT p.PathId, p.SnapshotId AS PathSnapshotId,
                                  latest.ExplanationId, latest.CreatedUtc, latest.InventoryFalsificationJson
                           FROM dbo.SecurityEvidencePaths AS p
                           CROSS APPLY
                           (
                               SELECT TOP (1) e.ExplanationId, e.CreatedUtc, e.InventoryFalsificationJson
                               FROM dbo.SecurityEvidencePathExplanations AS e
                               WHERE e.TenantId = p.TenantId AND e.PathId = p.PathId
                               ORDER BY e.CreatedUtc DESC, e.ExplanationId DESC
                           ) AS latest
                           WHERE p.TenantId = @TenantId AND p.WorkspaceId = @WorkspaceId
                             AND p.ProjectId = @ProjectId AND p.SnapshotId = @SnapshotId
                             AND p.PathId IN @PathIds AND latest.InventoryFalsificationJson IS NOT NULL;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        List<SecurityEvidencePathVerificationRecord> result = [];
        const int PathIdBatchSize = 500;
        foreach (Guid[] batch in pathIds.Distinct().Chunk(PathIdBatchSize))
        {
            IEnumerable<ExplanationRow> rows = await conn.QueryAsync<ExplanationRow>(
                new CommandDefinition(sql,
                    new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, SnapshotId = snapshotId, PathIds = batch },
                    cancellationToken: cancellationToken));
            foreach (ExplanationRow row in rows)
            {
                if (ReadInventoryFalsification(row, scope) is { } observation)
                    result.Add(new(row.PathId, row.ExplanationId, DateTime.SpecifyKind(row.CreatedUtc, DateTimeKind.Utc), observation));
            }
        }

        return result;
    }

    private static SecurityEvidencePathExplanationRecord Map(ExplanationRow row, ScopeContext scope)
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
            ModelOutputRejection = row.ModelOutputRejection,
            InventoryFalsification = ReadInventoryFalsification(row, scope),
            CreatedUtc = row.CreatedUtc,
        };
    }

    private static InventoryFalsificationProbe? ReadInventoryFalsification(ExplanationRow row, ScopeContext scope)
    {
        if (string.IsNullOrWhiteSpace(row.InventoryFalsificationJson))
            return null;

        InventoryFalsificationProbe? probe;
        try
        {
            probe = JsonSerializer.Deserialize<InventoryFalsificationProbe>(row.InventoryFalsificationJson, JsonOptions);
        }
        catch (JsonException)
        {
            // A corrupt or incompatible observation must not be interpreted as evidence.
            return null;
        }

        if (probe is null || string.IsNullOrWhiteSpace(probe.Coverage) || !Enum.IsDefined(probe.Outcome))
            return null;

        if (probe.Verification is null)
            return probe.Outcome is InventoryFalsificationOutcome.Untestable or InventoryFalsificationOutcome.HumanReviewRequired
                ? probe : null;

        var observation = probe.Verification;
        if (observation.Evidence is not { } evidence ||
            evidence.TenantId != scope.TenantId || evidence.WorkspaceId != scope.WorkspaceId ||
            evidence.ProjectId != scope.ProjectId || observation.SnapshotId != row.PathSnapshotId ||
            observation.CapturedUtc is null || observation.CloudResourceId == Guid.Empty ||
            evidence.ResourceRowId == Guid.Empty || string.IsNullOrWhiteSpace(evidence.VerifierVersion) ||
            string.IsNullOrWhiteSpace(evidence.PropertyKey) || evidence.MaximumCaptureAgeHours <= 0)
            return null;

        return (probe.Outcome, observation.Outcome) switch
        {
            (InventoryFalsificationOutcome.SurvivedWithinTestedScope, PublicNetworkAccessVerificationOutcome.Verified) => probe,
            (InventoryFalsificationOutcome.Refuted, PublicNetworkAccessVerificationOutcome.Contradicted) => probe,
            (InventoryFalsificationOutcome.Untestable, PublicNetworkAccessVerificationOutcome.Unverified) => probe,
            _ => null,
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

        public string? ModelOutputRejection
        {
            get;
            init;
        }

        public string? InventoryFalsificationJson
        {
            get;
            init;
        }

        public Guid PathSnapshotId
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
