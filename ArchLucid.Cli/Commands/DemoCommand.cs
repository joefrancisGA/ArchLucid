namespace ArchLucid.Cli.Commands;

/// <summary>Copies <c>docs/demo/sample-pack</c> to a local folder for sponsor / PLG collateral.</summary>
internal static class DemoCommand
{
    public static Task<int> RunAsync(string[] args)
    {
        string? outDir = null;

        for (int i = 0; i < args.Length; i++)
        {
            if (string.Equals(args[i], "--out", StringComparison.Ordinal) && i + 1 < args.Length)
            {
                outDir = args[i + 1];
                i++;

                continue;
            }

            if (string.Equals(args[i], "--help", StringComparison.Ordinal) || string.Equals(args[i], "-h", StringComparison.Ordinal))
            {
                WriteUsage();

                return Task.FromResult(CliExitCode.UsageError);
            }

            Console.Error.WriteLine($"Unexpected argument: {args[i]}");
            WriteUsage();

            return Task.FromResult(CliExitCode.UsageError);
        }

        string dest = string.IsNullOrWhiteSpace(outDir)
            ? Path.Combine(Directory.GetCurrentDirectory(), "archlucid-demo-pack")
            : Path.GetFullPath(outDir);

        string? repo = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        if (repo is null)
        {
            Console.Error.WriteLine("Could not resolve repository root containing docs/demo/sample-pack.");

            return Task.FromResult(CliExitCode.OperationFailed);
        }

        string src = Path.Combine(repo, "docs", "demo", "sample-pack");

        if (!Directory.Exists(src))
        {
            Console.Error.WriteLine($"Missing demo pack source: {src}");

            return Task.FromResult(CliExitCode.OperationFailed);
        }

        Directory.CreateDirectory(dest);
        CopyDirectory(src, dest);
        Console.WriteLine($"Copied demo sample pack to {dest}");

        return Task.FromResult(CliExitCode.Success);
    }

    private static void CopyDirectory(string sourceDir, string destDir)
    {
        foreach (string file in Directory.EnumerateFiles(sourceDir))
        {
            string name = Path.GetFileName(file);
            File.Copy(file, Path.Combine(destDir, name), overwrite: true);
        }
    }

    private static void WriteUsage()
    {
        Console.WriteLine("Usage: archlucid demo export [--out <dir>]");
    }
}
