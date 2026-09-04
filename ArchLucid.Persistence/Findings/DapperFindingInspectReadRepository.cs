using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Dapper read joining <c>dbo.FindingRecords</c>, snapshots, runs, optional <c>dbo.DecisioningTraces</c>, and audit.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; covered via API integration tests.")]
public sealed partial class DapperFindingInspectReadRepository(ISqlConnectionFactory connectionFactory)
    : IFindingInspectReadRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<FindingInspectResponse?> GetInspectAsync(
        ScopeContext scope,
        string findingId,
        CancellationToken ct,
        FindingInspectReadOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("Finding id is required.", nameof(findingId));

        bool includeTypedPayload = options?.IncludeTypedPayload ?? true;

        await using Microsoft.Data.SqlClient.SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        MainRow? row = await LoadMainRowAsync(connection, scope, findingId, includeTypedPayload, ct);

        if (row is null)
            return null;

        DispositionJoinResult joinResult = await LoadDispositionJoinAsync(connection, scope, findingId, row, ct);

        return MapInspectResponse(row, joinResult, includeTypedPayload);
    }
}
