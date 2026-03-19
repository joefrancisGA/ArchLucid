using ArchiForge.Persistence.Connections;
using Dapper;

namespace ArchiForge.Persistence.Sql;

public sealed class SqlSchemaBootstrapper : ISchemaBootstrapper
{
    private readonly ISqlConnectionFactory _connectionFactory;
    private readonly string _scriptPath;

    public SqlSchemaBootstrapper(
        ISqlConnectionFactory connectionFactory,
        string scriptPath)
    {
        _connectionFactory = connectionFactory;
        _scriptPath = scriptPath;
    }

    public async Task EnsureSchemaAsync(CancellationToken ct)
    {
        if (!File.Exists(_scriptPath))
            throw new FileNotFoundException($"Schema script not found: {_scriptPath}");

        var script = await File.ReadAllTextAsync(_scriptPath, ct);
        var batches = SplitGoBatches(script);

        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        foreach (var batch in batches)
        {
            if (!string.IsNullOrWhiteSpace(batch))
            {
                await connection.ExecuteAsync(new CommandDefinition(batch, cancellationToken: ct));
            }
        }
    }

    private static IReadOnlyList<string> SplitGoBatches(string script)
    {
        var lines = script.Replace("\r\n", "\n", StringComparison.Ordinal).Split('\n');
        var batches = new List<string>();
        var current = new List<string>();

        foreach (var line in lines)
        {
            if (line.Trim().Equals("GO", StringComparison.OrdinalIgnoreCase))
            {
                batches.Add(string.Join(Environment.NewLine, current));
                current.Clear();
            }
            else
            {
                current.Add(line);
            }
        }

        if (current.Count > 0)
        {
            batches.Add(string.Join(Environment.NewLine, current));
        }

        return batches;
    }
}
