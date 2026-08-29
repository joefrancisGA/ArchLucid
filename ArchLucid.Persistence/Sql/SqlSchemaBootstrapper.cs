using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Bootstraps the SQL schema by reading a T-SQL script file from <paramref name="scriptPath" />,
///     splitting it on <c>GO</c> batch separators, and executing each batch against the database.
/// </summary>
public sealed class SqlSchemaBootstrapper(
    ISqlConnectionFactory connectionFactory,
    string scriptPath,
    int? commandTimeoutSeconds = null)
    : ISchemaBootstrapper
{
    [ExcludeFromCodeCoverage(Justification =
        "Reads file and executes SQL batches; requires live SQL Server. SplitGoBatches is tested separately.")]
    public async Task EnsureSchemaAsync(CancellationToken ct)
    {
        if (!File.Exists(scriptPath))
            throw new FileNotFoundException($"Schema script not found: {scriptPath}");

        string script = await File.ReadAllTextAsync(scriptPath, ct);
        IReadOnlyList<string> batches = SplitGoBatches(script);
        List<string> executableBatches = batches
            .Where(static batch => !string.IsNullOrWhiteSpace(batch))
            .ToList();
        int totalBatches = executableBatches.Count;
        bool logProgress = totalBatches > 50;

        if (logProgress)
        {
            Console.WriteLine(
                $"Startup: schema bootstrap executing {totalBatches} SQL batches from {Path.GetFileName(scriptPath)}.");
        }

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        int executedBatches = 0;

        foreach (string batch in executableBatches)
        {
            CommandDefinition command = new(
                batch,
                commandTimeout: commandTimeoutSeconds,
                cancellationToken: ct);
            await connection.ExecuteAsync(command);
            executedBatches++;

            if (logProgress
                && (executedBatches == 1 || executedBatches % 100 == 0 || executedBatches == totalBatches))
            {
                Console.WriteLine(
                    $"Startup: schema bootstrap progress {executedBatches}/{totalBatches} batches.");
            }
        }
    }

    public IReadOnlyList<string> SplitGoBatches(string script)
    {
        return SqlGoBatchSplitter.Split(script);
    }
}
