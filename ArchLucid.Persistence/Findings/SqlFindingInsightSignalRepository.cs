using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Findings;

[ExcludeFromCodeCoverage(Justification = "SQL Server–dependent repository.")]
public sealed class SqlFindingInsightSignalRepository(ISqlConnectionFactory connectionFactory)
    : IFindingInsightSignalRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<FindingInsightSignalInsertResult> TryInsertAsync(
        FindingInsightSignalSubmission submission,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(submission);

        Guid signalId = Guid.NewGuid();

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string insertSql = """
                                 INSERT INTO dbo.FindingInsightSignals (
                                     SignalId, TenantId, RunId, FindingId, UserId, Kind, CreatedUtc)
                                 SELECT
                                     @SignalId, @TenantId, @RunId, @FindingId, @UserId, @Kind, SYSUTCDATETIME()
                                 WHERE NOT EXISTS (
                                     SELECT 1
                                     FROM dbo.FindingInsightSignals
                                     WHERE TenantId = @TenantId
                                       AND RunId = @RunId
                                       AND FindingId = @FindingId
                                       AND UserId = @UserId
                                       AND Kind = @Kind);
                                 """;

        int rows = await connection.ExecuteAsync(
            new CommandDefinition(
                insertSql,
                new
                {
                    SignalId = signalId,
                    submission.TenantId,
                    submission.RunId,
                    submission.FindingId,
                    submission.UserId,
                    Kind = (byte)submission.Kind
                },
                cancellationToken: cancellationToken));

        if (rows > 0)
        {
            return new FindingInsightSignalInsertResult
            {
                SignalId = signalId,
                Created = true
            };
        }

        const string existingSql = """
                                   SELECT TOP (1) SignalId
                                   FROM dbo.FindingInsightSignals
                                   WHERE TenantId = @TenantId
                                     AND RunId = @RunId
                                     AND FindingId = @FindingId
                                     AND UserId = @UserId
                                     AND Kind = @Kind;
                                   """;

        Guid existingSignalId = await connection.QuerySingleAsync<Guid>(
            new CommandDefinition(
                existingSql,
                new
                {
                    submission.TenantId,
                    submission.RunId,
                    submission.FindingId,
                    submission.UserId,
                    Kind = (byte)submission.Kind
                },
                cancellationToken: cancellationToken));

        return new FindingInsightSignalInsertResult
        {
            SignalId = existingSignalId,
            Created = false
        };
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<FindingInsightSignalKind>> ListKindsForUserAsync(
        Guid tenantId,
        Guid runId,
        string findingId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(findingId);
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT Kind
                           FROM dbo.FindingInsightSignals
                           WHERE TenantId = @TenantId
                             AND RunId = @RunId
                             AND FindingId = @FindingId
                             AND UserId = @UserId
                           ORDER BY CreatedUtc ASC;
                           """;

        IEnumerable<byte> rows = await connection.QueryAsync<byte>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    RunId = runId,
                    FindingId = findingId.Trim(),
                    UserId = userId.Trim()
                },
                cancellationToken: cancellationToken));

        return rows.Select(static kind => (FindingInsightSignalKind)kind).ToList();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<EngineInsightNoveltyRateRow>> ListNoveltyRatesAsync(
        ScopeContext scope,
        DateTime fromUtc,
        DateTime toUtcExclusive,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (toUtcExclusive <= fromUtc)
        {
            return [];
        }

        PersistenceTenantScope.RequireScopedTenant(scope);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        DynamicParameters parameters = new();
        parameters.Add("FromUtc", fromUtc);
        parameters.Add("ToUtcExclusive", toUtcExclusive);
        parameters.Add("DidNotThinkOfThatKind", (byte)FindingInsightSignalKind.DidNotThinkOfThat);
        parameters.Add("DecisionGradeClassification", (byte)FindingClassification.DecisionGradeFinding);
        parameters.Add("PromoteTreatment", (byte)FindingTreatment.Promote);
        PersistenceTenantScope.AddScopeTripleIfNeeded(parameters, scope);

        IEnumerable<EngineInsightNoveltyRateSqlRow> rows = await connection.QueryAsync<EngineInsightNoveltyRateSqlRow>(
            new CommandDefinition(
                EngineInsightNoveltyRateSql.BuildListByEngineType(scope),
                parameters,
                cancellationToken: cancellationToken));

        return rows
            .Select(static row => new EngineInsightNoveltyRateRow
            {
                EngineType = row.EngineType,
                DecisionGradeCount = row.DecisionGradeCount,
                DidNotThinkOfThatCount = row.DidNotThinkOfThatCount,
                Rate = EngineInsightNoveltyRateCalculator.ComputeRate(
                    row.DecisionGradeCount,
                    row.DidNotThinkOfThatCount),
            })
            .ToList();
    }
}
