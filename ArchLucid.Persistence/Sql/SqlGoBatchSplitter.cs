namespace ArchLucid.Persistence.Sql;

/// <summary>Splits T-SQL scripts on line-based <c>GO</c> batch separators (SSMS / SqlSchemaBootstrapper convention).</summary>
public static class SqlGoBatchSplitter
{
    public static IReadOnlyList<string> Split(string script)
    {
        ArgumentNullException.ThrowIfNull(script);

        string[] lines = script.Replace("\r\n", "\n", StringComparison.Ordinal).Split('\n');
        List<string> batches = [];
        List<string> current = [];

        foreach (string line in lines)
        {
            if (line.Trim().Equals("GO", StringComparison.OrdinalIgnoreCase))
            {
                batches.Add(string.Join(Environment.NewLine, current));
                current.Clear();
                continue;
            }

            current.Add(line);
        }

        if (current.Count > 0)
            batches.Add(string.Join(Environment.NewLine, current));

        return batches;
    }
}
