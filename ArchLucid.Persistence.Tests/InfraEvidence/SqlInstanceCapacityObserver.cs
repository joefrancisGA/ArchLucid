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
            long? physical = reader.IsDBNull(0) ? null : reader.GetInt64(0);
            long? committed = reader.IsDBNull(1) ? null : reader.GetInt64(1);
            await reader.DisposeAsync();
            // Cumulative CPU worker time of cached completed query plans, in microseconds.
            // Not SQL process CPU and can drop if plans are evicted or server resets.
            try
            {
                command.CommandText = "SELECT SUM(CONVERT(bigint, total_worker_time)) FROM sys.dm_exec_query_stats";
                object? raw = await command.ExecuteScalarAsync(ct);
                long? microseconds = raw is null or DBNull ? null : Convert.ToInt64(raw);
                return new(microseconds.HasValue ? microseconds.Value / 1000 : null,
                    physical, committed, "CACHED_QUERY_WORKER_CPU_INSTANCE_WIDE");
            }
            catch (SqlException)
            {
                return new(null, physical, committed, "SQL_QUERY_CPU_DMV_UNAVAILABLE");
            }
        }
        catch (SqlException)
        {
            return new(null, null, null, "SQL_INSTANCE_DMV_UNAVAILABLE");
        }
    }
}
