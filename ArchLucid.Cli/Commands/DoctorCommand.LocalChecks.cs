using System.Reflection;
using System.Runtime.InteropServices;

namespace ArchLucid.Cli.Commands;

internal static partial class DoctorCommand
{
    private static void PrintCliBuildInfo()
    {
        Console.WriteLine("--- CLI build info ---");

        Assembly cliAssembly = typeof(DoctorCommand).Assembly;
        AssemblyName name = cliAssembly.GetName();
        string assemblyVersion = name.Version?.ToString() ?? "unknown";

        string informational = cliAssembly
                                   .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
                               ?? assemblyVersion;

        Console.WriteLine($"CLI version:    {informational}");
        Console.WriteLine($"Assembly:       {assemblyVersion}");
        Console.WriteLine($"Runtime:        {RuntimeInformation.FrameworkDescription}");
        Console.WriteLine();
    }

    private static void RunLocalProjectChecks(ArchLucidProjectScaffolder.ArchLucidCliConfig? config)
    {
        Console.WriteLine("--- Local project ---");
        string cwd = Directory.GetCurrentDirectory();

        if (config is null)
        {
            Console.WriteLine(
                $"No archlucid.json in '{cwd}' (skipped local outputs/brief checks). API checks still run.");

            Console.WriteLine();

            return;
        }

        Console.WriteLine($"Project: {config.ProjectName} (schema {config.SchemaVersion})");

        string briefPath = Path.Combine(cwd, config.Inputs.Brief);
        Console.WriteLine(File.Exists(briefPath)
            ? $"Brief: OK — {config.Inputs.Brief}"
            : $"Brief: MISSING — expected file at {config.Inputs.Brief} (needed for 'archlucid run').");

        string outputsDir = Path.Combine(cwd, config.Outputs.LocalCacheDir);

        try
        {
            Directory.CreateDirectory(outputsDir);
            string probe = Path.Combine(outputsDir, ".archlucid-write-probe");
            File.WriteAllText(probe, "ok");
            File.Delete(probe);
            Console.WriteLine($"Outputs dir: OK — {config.Outputs.LocalCacheDir} is writable");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Outputs dir: FAIL — cannot use '{config.Outputs.LocalCacheDir}': {ex.Message}");
        }

        Console.WriteLine();
    }

    private static void PrintSaaSProfileHints()
    {
        Console.WriteLine("--- SaaS profile hints (operator checklist) ---");
        Console.WriteLine(
            "These rows are **not** fetched from the API host process; they inspect local environment variables " +
            "the SaaS profile expects. See `ArchLucid.Api/appsettings.SaaS.json` and `docs/engineering/FIRST_30_MINUTES.md`.");

        string apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY") ?? string.Empty;
        string sql =
            Environment.GetEnvironmentVariable("ConnectionStrings__ArchLucid")
            ?? Environment.GetEnvironmentVariable("ARCHLUCID__ConnectionStrings__ArchLucid")
            ?? string.Empty;

        Console.WriteLine();
        Console.WriteLine("| Check | Status | How to fix |");
        Console.WriteLine("| --- | --- | --- |");
        Console.WriteLine(
            $"| `ARCHLUCID_API_KEY` for `/health/diagnostics` aggregate | {Cell(apiKey)} | Export a read-capable API key (see `docs/runbooks/API_KEY_ROTATION.md`). |");
        Console.WriteLine(
            $"| SQL connection string | {Cell(sql)} | Set `ConnectionStrings__ArchLucid` or `ARCHLUCID__ConnectionStrings__ArchLucid` (see `docs/engineering/FIRST_30_MINUTES.md`). |");
        Console.WriteLine(
            "| `Authentication:ApiKey:DevelopmentBypassAll` | MANUAL | Must be **false** in SaaS; see `ArchLucid.Host.Core/Startup/AuthSafetyGuard.cs`. |");
        Console.WriteLine(
            "| SQL tenancy | N/A | Per-tenant catalogs + request scope; database RLS was removed (DbUp 148). |");
        Console.WriteLine();

        static string Cell(string value)
        {
            return string.IsNullOrWhiteSpace(value) ? "MISSING" : "OK";
        }
    }
}
