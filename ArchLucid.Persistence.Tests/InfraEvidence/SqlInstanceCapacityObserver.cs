using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

/// <summary>Best-effort SQL Server instance observations; never attributed to one query.</summary>
internal static class SqlInstanceCapacityObserver
{
    internal sealed record Sample(long? CpuMilliseconds, long? PhysicalMemoryKb,
        long? CommittedMemoryKb, string EvidenceStatus);

    internal static async Task<Sample> CaptureAsync(string connectionString, CancellationToken ct = default)
    {
        try
        {
            await using SqlConnection connection = new(connectionString);
            await connection.OpenAsync(ct);
            await using SqlCommand command = connection.CreateCommand();
            command.CommandTimeout = 5;
            // cpu_ticks and ms_ticks have environment/version-specific meaning, so do
            // not infer CPU time from them. Memory DMV is an instance snapshot.
            command.CommandText = """
                SELECT physical_memory_in_use_kb, virtual_address_space_committed_kb
                FROM sys.dm_os_process_memory
                """;
            await using SqlDataReader reader = await command.ExecuteReaderAsync(ct);
            if (!await reader.ReadAsync(ct))
                return new(null, null, null, "SQL_INSTANCE_DMV_EMPTY");
            return new(null, reader.IsDBNull(0) ? null : reader.GetInt64(0),
                reader.IsDBNull(1) ? null : reader.GetInt64(1),
                "SQL_INSTANCE_MEMORY_SNAPSHOT_NOT_QUERY_ISOLATED");
        }
        catch (SqlException)
        {
            return new(null, null, null, "SQL_INSTANCE_DMV_UNAVAILABLE");
        }
    }
}
