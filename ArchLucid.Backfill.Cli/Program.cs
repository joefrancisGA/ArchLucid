using System.Diagnostics;

using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Caching;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Coordination.Backfill;
using ArchLucid.Persistence.Options;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Scoping;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Backfill.Cli;

// Maintenance host: composes Persistence.Coordination.Backfill directly (no Application layer).
// Architecture exception — see docs/library/SqlRelationalBackfill.md and ARCHITECTURE_CONSTRAINTS.md Tier 4b.

internal static class Program
{
    private static async Task<int> Main(string[] args)
    {
        if (args.Any(static a => a.Equals("--help", StringComparison.OrdinalIgnoreCase) ||
                                 a.Equals("-h", StringComparison.OrdinalIgnoreCase)))
        {
            PrintHelp();
            return 0;
        }

        if (!TryParseConnectionString(args, out string? connectionString) ||
            string.IsNullOrWhiteSpace(connectionString))
        {
            await Console.Error.WriteLineAsync(
                "Set ARCHLUCID_SQL, or pass --connection \"...\", or a positional connection string. Use --help for scope flags.");
            return 1;
        }

        bool readinessMode = args.Any(static a => a.Equals("--readiness", StringComparison.OrdinalIgnoreCase));

        ServiceCollection services = new();
        services.AddSingleton<ISqlConnectionFactory>(_ => new SqlConnectionFactory(connectionString));
        services.AddSingleton<IScopeContextProvider, EmptyPersistenceScopeContextProvider>();
        services.AddSingleton<SqlPrimaryMirroredReadReplicaConnectionFactory>(sp =>
            new SqlPrimaryMirroredReadReplicaConnectionFactory(sp.GetRequiredService<ISqlConnectionFactory>()));
        services.AddSingleton<IGoldenManifestLookupReadConnectionFactory>(sp =>
            sp.GetRequiredService<SqlPrimaryMirroredReadReplicaConnectionFactory>());
        services.AddSingleton<IArtifactBlobStore, NullArtifactBlobStore>();
        services.AddSingleton<IOptionsMonitor<ArtifactLargePayloadOptions>>(
            new FixedOptionsMonitor<ArtifactLargePayloadOptions>(new ArtifactLargePayloadOptions()));
        services.AddSingleton<SqlContextSnapshotRepository>();
        services.AddSingleton<SqlGraphSnapshotRepository>();
        services.AddSingleton<SqlFindingsSnapshotRepository>();
        services.AddSingleton<SqlGoldenManifestRepository>();
        services.AddSingleton<SqlArtifactBundleRepository>();
        services.AddSingleton<IGraphSnapshotProjectionCache>(NonCachingGraphSnapshotProjectionCache.Instance);
        services.AddSingleton<SqlRelationalBackfillService>();
        services.AddSingleton<ISqlRelationalBackfillService>(sp =>
            sp.GetRequiredService<SqlRelationalBackfillService>());
        services.AddSingleton<SqlCutoverReadinessService>();
        services.AddSingleton<ICutoverReadinessService>(sp => sp.GetRequiredService<SqlCutoverReadinessService>());
        services.AddLogging(builder =>
        {
            builder.AddConsole();
            builder.SetMinimumLevel(LogLevel.Information);
        });

        await using ServiceProvider provider = services.BuildServiceProvider();

        BackfillCliOutputJsonOptionsParser.TryParse(args, out bool outputJson, out string? outputJsonPath);

        if (readinessMode)
            return await RunReadinessAsync(provider, outputJson, outputJsonPath);

        return await RunBackfillAsync(provider, args, outputJson, outputJsonPath);
    }

    private static async Task<int> RunBackfillAsync(
        ServiceProvider provider,
        string[] args,
        bool outputJson,
        string? outputJsonPath)
    {
        SqlRelationalBackfillOptions options = ParseBackfillOptions(args);
        ISqlRelationalBackfillService backfill = provider.GetRequiredService<ISqlRelationalBackfillService>();

        Stopwatch stopwatch = Stopwatch.StartNew();
        SqlRelationalBackfillReport report = await backfill.RunAsync(options, CancellationToken.None);
        stopwatch.Stop();

        Console.WriteLine(
            $"Backfill finished. Processed={report.ProcessedCount} Success={report.SuccessCount} Failures={report.FailureCount}");

        foreach (SqlRelationalBackfillFailure failure in report.Failures)
            Console.WriteLine($"{failure.Stage} {failure.EntityKey}: {failure.Message}");

        if (outputJson)
        {
            string json = BackfillCliJsonReportSerializer.SerializeBackfillReport(report, stopwatch.ElapsedMilliseconds);
            await BackfillCliJsonReportWriter.WriteAsync(json, outputJsonPath, CancellationToken.None);
        }

        return report.FailureCount > 0 ? 2 : 0;
    }

    private static async Task<int> RunReadinessAsync(
        ServiceProvider provider,
        bool outputJson,
        string? outputJsonPath)
    {
        ICutoverReadinessService readiness = provider.GetRequiredService<ICutoverReadinessService>();
        Stopwatch stopwatch = Stopwatch.StartNew();
        CutoverReadinessReport report = await readiness.AssessAsync(CancellationToken.None);
        stopwatch.Stop();

        Console.WriteLine();
        Console.WriteLine("=== Relational Cutover Readiness Report ===");
        Console.WriteLine();
        Console.WriteLine($"{"Slice",-45} {"Total",7} {"Ready",7} {"Missing",9} {"Status",10}");
        Console.WriteLine(new string('-', 80));

        foreach (CutoverSliceReadiness slice in report.Slices)
        {
            string status = slice.IsReady ? "READY" : "NOT READY";
            Console.WriteLine(
                $"{slice.SliceName,-45} {slice.TotalHeaderRows,7} {slice.HeadersWithRelationalRows,7} {slice.HeadersMissingRelationalRows,9} {status,10}");
        }

        Console.WriteLine(new string('-', 80));
        Console.WriteLine();

        Console.WriteLine(report.IsFullyReady
            ? "All slices are READY. Relational-only read paths are supported for audited slices."
            : $"{report.SlicesNotReady.Count} slice(s) NOT READY. Run backfill before relying on relational-only reads.");

        Console.WriteLine();

        if (outputJson)
        {
            string json = BackfillCliJsonReportSerializer.SerializeReadinessReport(report, stopwatch.ElapsedMilliseconds);
            await BackfillCliJsonReportWriter.WriteAsync(json, outputJsonPath, CancellationToken.None);
        }

        return report.IsFullyReady ? 0 : 3;
    }

    private static void PrintHelp()
    {
        Console.WriteLine(
            """
            ArchLucid.Backfill.Cli — one-time JSON → relational backfill and cutover readiness.

            Connection (first match wins):
              ARCHLUCID_SQL environment variable
              --connection|-c "<ADO.NET connection string>"
              first positional argument (if not a flag)

            Modes:
              (default)       Run the backfill (JSON → relational child tables).
              --readiness     Read-only assessment: per-slice coverage report.
                              Shows how many header rows have relational children
                              and whether each slice has full relational coverage.

            Backfill scope (default: all stages enabled, ignored when --readiness):
              --only <list>   Comma-separated: context, graph, findings, golden, artifact
                              Enables only those stages (others off).
              --skip-context|--skip-graph|--skip-findings|--skip-golden|--skip-artifact
                              Turns off that stage (combine with default all-on).

            If --only is present, --skip-* flags are ignored.

            Output:
              --output-json [path]
                              Emit a machine-readable JSON report after completion.
                              Without a path, writes to stdout; with a path, writes the file.

            Exit codes:
              0  Success (backfill clean, or readiness = all ready)
              1  Bad usage / no connection string
              2  Backfill: one or more entity failures
              3  Readiness: one or more slices not ready
            """);
    }

    private static bool TryParseConnectionString(string[] args, out string? connectionString)
    {
        connectionString = Environment.GetEnvironmentVariable("ARCHLUCID_SQL");

        for (int i = 0; i < args.Length; i++)
        {
            string a = args[i];
            if (a.Equals("--connection", StringComparison.OrdinalIgnoreCase) ||
                a.Equals("-c", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 < args.Length)
                    connectionString = args[++i];

                continue;
            }

            if (a.StartsWith('-'))
                continue;

            if (string.IsNullOrWhiteSpace(connectionString))
                connectionString = a;
        }

        return !string.IsNullOrWhiteSpace(connectionString);
    }

    private static SqlRelationalBackfillOptions ParseBackfillOptions(string[] args)
    {
        string? onlyList = null;
        bool skipContext = false;
        bool skipGraph = false;
        bool skipFindings = false;
        bool skipGolden = false;
        bool skipArtifact = false;

        for (int i = 0; i < args.Length; i++)
        {
            string a = args[i];
            if (a.Equals("--only", StringComparison.OrdinalIgnoreCase) && i + 1 < args.Length)
            {
                onlyList = args[++i];
                continue;
            }

            if (a.Equals("--output-json", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 < args.Length && !args[i + 1].StartsWith('-'))
                    i++;

                continue;
            }

            if (a.Equals("--skip-context", StringComparison.OrdinalIgnoreCase))
                skipContext = true;
            else if (a.Equals("--skip-graph", StringComparison.OrdinalIgnoreCase))
                skipGraph = true;
            else if (a.Equals("--skip-findings", StringComparison.OrdinalIgnoreCase))
                skipFindings = true;
            else if (a.Equals("--skip-golden", StringComparison.OrdinalIgnoreCase))
                skipGolden = true;
            else if (a.Equals("--skip-artifact", StringComparison.OrdinalIgnoreCase))
                skipArtifact = true;
        }

        if (string.IsNullOrWhiteSpace(onlyList))
            return new SqlRelationalBackfillOptions
            {
                ContextSnapshots = !skipContext,
                GraphSnapshots = !skipGraph,
                FindingsSnapshots = !skipFindings,
                GoldenManifestsPhase1 = !skipGolden,
                ArtifactBundles = !skipArtifact
            };

        HashSet<string> stages = new(StringComparer.OrdinalIgnoreCase);
        foreach (string part in onlyList.Split(',',
                     StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))

            if (TryMapStage(part, out string key))
                stages.Add(key);

        return new SqlRelationalBackfillOptions
        {
            ContextSnapshots = stages.Contains("context"),
            GraphSnapshots = stages.Contains("graph"),
            FindingsSnapshots = stages.Contains("findings"),
            GoldenManifestsPhase1 = stages.Contains("golden"),
            ArtifactBundles = stages.Contains("artifact")
        };
    }

    private static bool TryMapStage(string token, out string key)
    {
        string? mapped = token.Trim().ToLowerInvariant() switch
        {
            "context" => "context",
            "graph" => "graph",
            "findings" => "findings",
            "golden" => "golden",
            "artifact" => "artifact",
            "artifacts" => "artifact",
            _ => null
        };

        if (mapped is null)
        {
            key = string.Empty;
            return false;
        }

        key = mapped;
        return true;
    }
}
