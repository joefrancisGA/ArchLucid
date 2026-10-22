using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.MigrateVerify;

namespace ArchLucid.Persistence.MigrateVerify.Cli;

/// <summary>CI/dev entrypoint that applies embedded DbUp scripts via <see cref="DatabaseMigrator.Run" />.</summary>
/// <remarks>
///     Intended for pipelines that provision an empty SQL catalog then verify migrations alone (no HTTP host).
///     After DbUp, runs curated sentinel drift checks (TB-065).
/// </remarks>
[ExcludeFromCodeCoverage(Justification =
    "Thin CI entrypoint; Tier 1.5 GitHub Actions job exercises migrations end-to-end against Docker SQL Server.")]
internal static class Program
{
    private const string SkipDriftFlag = "--skip-drift";
    private const string SystemPlaneFlag = "--system-plane";

    private static async Task<int> Main(string[] args)
    {
        MigrateVerifyOptions options = MigrateVerifyOptions.Parse(args);

        if (!MigrateVerifyConnectionStringReader.TryReadConnectionString(
                options.ConnectionStringArgs,
                out string connectionString,
                out string usageError))
        {
            await Console.Error.WriteLineAsync(usageError);
            await Console.Error.WriteLineAsync(UsageText());

            return 1;
        }

        try
        {
            if (options.SystemPlane)
                DatabaseMigrator.RunSystem(connectionString);
            else
                DatabaseMigrator.Run(connectionString);

            Console.WriteLine("DbUp migrations applied successfully.");

            if (!options.SkipDrift)
            {
                IReadOnlyList<SchemaSentinelExpectation> sentinels = options.SystemPlane
                    ? SystemSchemaSentinelManifest.Expectations
                    : TenantSchemaSentinelManifest.Expectations;

                SchemaDriftVerifier.VerifyOrThrow(connectionString, sentinels);
                Console.WriteLine("Schema sentinel drift check passed.");
            }

            return 0;
        }
        catch (Exception ex)
        {
            await Console.Error.WriteLineAsync($"MigrateVerify failed: {ex.Message}");
            Console.Error.WriteLine(ex);

            return 2;
        }
    }

    private static string UsageText()
    {
        return """
               Usage:
                 dotnet run --project ArchLucid.Persistence.MigrateVerify -- <connectionString> [--skip-drift] [--system-plane]
               Or set ARCHLUCID_CI_DBUP_CONNECTION_STRING.
               """;
    }

    private sealed class MigrateVerifyOptions
    {
        public IReadOnlyList<string> ConnectionStringArgs { get; private init; } = [];

        public bool SkipDrift { get; private init; }

        public bool SystemPlane { get; private init; }

        public static MigrateVerifyOptions Parse(IReadOnlyList<string>? args)
        {
            List<string> connectionArgs = [];
            bool skipDrift = false;
            bool systemPlane = false;

            if (args is not null)
            {
                foreach (string arg in args)
                {
                    if (string.Equals(arg, SkipDriftFlag, StringComparison.OrdinalIgnoreCase))
                    {
                        skipDrift = true;
                        continue;
                    }

                    if (string.Equals(arg, SystemPlaneFlag, StringComparison.OrdinalIgnoreCase))
                    {
                        systemPlane = true;
                        continue;
                    }

                    connectionArgs.Add(arg);
                }
            }

            return new MigrateVerifyOptions
            {
                ConnectionStringArgs = connectionArgs,
                SkipDrift = skipDrift,
                SystemPlane = systemPlane,
            };
        }
    }
}
