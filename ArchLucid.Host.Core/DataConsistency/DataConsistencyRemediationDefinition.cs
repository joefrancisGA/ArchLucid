using System.Data.Common;

namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>
///     Per-remediation SQL, transactional delete strategy, audit event, and payload shape for
///     <see cref="IDataConsistencyRemediationExecutor" />.
/// </summary>
public sealed class DataConsistencyRemediationDefinition
{
    public required string SelectCandidateIdsSql { get; init; }

    public required Func<DbDataReader, string> ReadCandidateId { get; init; }

    public required Func<
        DbConnection,
        DbTransaction,
        int,
        IReadOnlyList<string>,
        CancellationToken,
        Task<List<string>>> ExecuteTransactionalDeletes { get; init; }

    public required string AuditEventType { get; init; }

    public required Func<IReadOnlyList<string>, object> BuildAuditPayload { get; init; }
}
