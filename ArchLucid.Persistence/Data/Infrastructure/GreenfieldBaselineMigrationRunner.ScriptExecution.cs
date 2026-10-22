using System.Globalization;
using System.Reflection;
using System.Text.RegularExpressions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Infrastructure;

public static partial class GreenfieldBaselineMigrationRunner
{
    /// <summary>
    ///     Runs embedded incremental migrations whose script number is in <paramref name="minInclusive" />–
    ///     <paramref name="maxInclusive" /> (inclusive).
    /// </summary>
    private static void ExecuteIncrementalMigrationScriptsInInclusiveRange(
        SqlConnection connection,
        Assembly assembly,
        int minInclusive,
        int maxInclusive)
    {
        foreach (string resourceName in GetOrderedIncrementalMigrationResourceNames())
        {
            Match match = MigrationNumberRegex().Match(resourceName);

            if (!match.Success)
                continue;

            int n = int.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture);

            if (n < minInclusive || n > maxInclusive)
                continue;

            if (ShouldSkipEmbeddedMigrationResourceAlreadyApplied(connection, resourceName))
                continue;

            string sql = ReadEmbeddedScript(assembly, resourceName);
            IReadOnlyList<string> batches = SplitGoBatches(sql);

            foreach (string batch in batches)
            {
                if (string.IsNullOrWhiteSpace(batch))
                    continue;

                using SqlCommand batchCommand = new(batch, connection);
                batchCommand.CommandTimeout = 0;
                batchCommand.ExecuteNonQuery();
            }
        }
    }

    /// <summary>
    ///     The workflow script is not idempotent; skip it when its tables already exist so replay can still apply graph
    ///     parents and the rest of the <c>017</c>–<c>050</c> batch.
    /// </summary>
    private static bool ShouldSkipEmbeddedMigrationResourceAlreadyApplied(SqlConnection connection, string resourceName)
    {
        return resourceName.Contains("038_GovernanceWorkflow", StringComparison.OrdinalIgnoreCase)
               && BaselineCatalogSentinels.Read(connection).GovernanceWorkflow038Present;
    }

    [GeneratedRegex(@"\.Migrations\.(\d{3})_", RegexOptions.CultureInvariant)]
    private static partial Regex MigrationNumberRegex();

    private static string ReadEmbeddedScript(Assembly assembly, string name)
    {
        using Stream? stream = assembly.GetManifestResourceStream(name);

        if (stream is null)
            throw new InvalidOperationException($"Missing embedded migration script '{name}'.");

        using StreamReader reader = new(stream);
        return reader.ReadToEnd();
    }

    private static IReadOnlyList<string> SplitGoBatches(string script)
    {
        string[] lines = script.Replace("\r\n", "\n", StringComparison.Ordinal).Split('\n');
        List<string> batches = [];
        List<string> current = [];

        foreach (string line in lines)

            if (line.Trim().Equals("GO", StringComparison.OrdinalIgnoreCase))
            {
                batches.Add(string.Join(Environment.NewLine, current));
                current.Clear();
            }
            else

                current.Add(line);

        if (current.Count > 0)
            batches.Add(string.Join(Environment.NewLine, current));

        return batches;
    }
}
