namespace ArchLucid.Api.Tests;

/// <summary>Shared repo root discovery for Api.Tests source-scan guard facts.</summary>
internal static class IntegrationTestSourceScanSupport
{
    internal static string FindRepoRoot()
    {
        string? current = AppContext.BaseDirectory;

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current, "ArchLucid.sln")))
                return current;

            current = Directory.GetParent(current)?.FullName;
        }

        throw new InvalidOperationException("Could not locate repository root containing ArchLucid.sln.");
    }

    internal static IEnumerable<string> EnumerateApiTestSources(params string[] excludedFileNames)
    {
        string testsDir = Path.Combine(FindRepoRoot(), "ArchLucid.Api.Tests");

        foreach (string path in Directory.EnumerateFiles(testsDir, "*.cs", SearchOption.AllDirectories))
        {
            string fileName = Path.GetFileName(path);
            bool skip = false;

            foreach (string excludedFileName in excludedFileNames)
            {
                if (!string.Equals(fileName, excludedFileName, StringComparison.Ordinal))
                    continue;

                skip = true;

                break;
            }

            if (skip)
                continue;

            yield return path;
        }
    }
}
