using System.Data.Common;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     Per-orphan-type SQL, audit metadata, and delete strategy for data-consistency remediation.
/// </summary>
public sealed record DataConsistencyRemediationDefinition(
    string SelectSql,
    string AuditEventType,
    string AuditIdsJsonPropertyName,
    Func<DbDataReader, string> ReadCandidateId,
    Func<
        DbConnection,
        DbTransaction,
        IReadOnlyList<string>,
        int,
        CancellationToken,
        Task<List<string>>> DeleteCandidatesAsync);
