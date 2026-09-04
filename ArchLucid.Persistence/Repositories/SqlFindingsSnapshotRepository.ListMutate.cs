using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Sql;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlFindingsSnapshotRepository
{
    /// <inheritdoc />
    public async Task<FindingRecordMetadataPage> ListFindingRecordsKeysetAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        int? cursorSortOrder,
        Guid? cursorFindingRecordId,
        int? cursorPriorityRank,
        string? severity,
        string? category,
        string? findingType,
        int take,
        bool orderByPriority,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        FindingRecordKeysetPageRequest request = new(
            findingsSnapshotId,
            cursorSortOrder,
            cursorFindingRecordId,
            cursorPriorityRank,
            severity,
            category,
            findingType,
            take,
            orderByPriority);
        request.Validate();

        await using SqlConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(ct);
        return await FindingRecordKeysetPageReader.ReadAsync(connection, scope, request, ct);
    }

    public async Task UpdatePriorityRanksAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        IReadOnlyList<(string FindingId, int PriorityRank)> ranks,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(ranks);

        List<(string FindingId, int PriorityRank)> normalized = FindingPriorityRankUpdateBatch.Normalize(ranks);

        if (normalized.Count == 0)
            return;

        await using SqlConnection connection = await _writeConnectionFactory.CreateOpenConnectionAsync(ct);

        await SqlChunkedDapperBatch.ExecuteChunksAsync(
            connection,
            transaction: null,
            normalized.Count,
            SqlChunkedDapperBatch.DefaultMaxRowsPerCommand,
            (offset, rowCount) => FindingPriorityRankUpdateBatch.BuildChunk(
                findingsSnapshotId,
                scope,
                normalized,
                offset,
                rowCount),
            ct).ConfigureAwait(false);
    }
}
