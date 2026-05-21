using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.MigrateVerify;

namespace ArchLucid.Persistence.MigrateVerify.Cli;

/// <summary>CI/dev entrypoint that applies embedded DbUp scripts via <see cref="DatabaseMigrator.Run" />.</summary>
/// <remarks>
///     Intended for pipelines that provision an empty SQL catalog then verify migrations alone (no HTTP host).
/// </remarks>
[ExcludeFromCodeCoverage(Justification =
    "Thin CI entrypoint; Tier 1.5 GitHub Actions job exercises migrations end-to-end against Docker SQL Server.")]
internal static class Program
{
    private static async Task<int> Main(string[] args)
    {
        if (!MigrateVerifyConnectionStringReader.TryReadConnectionString(args, out string connectionString, out string usageError))
        {
            await Console.Error.WriteLineAsync(usageError);

            return 1;
        }

        try
        {
            DatabaseMigrator.Run(connectionString);
            Console.WriteLine("DbUp migrations applied successfully.");

            return 0;
        }
        catch (Exception ex)
        {
            await Console.Error.WriteLineAsync($"DbUp failed: {ex.Message}");
            Console.Error.WriteLine(ex);

            return 2;
        }
    }
}
