namespace ArchLucid.Architecture.Tests.WorkerCapability;

internal static class ProductCapabilityWorkerMapPaths
{
    internal static string MapFilePath =>
        Path.Combine(RepoRoot, "docs", "architecture", "data", "product-capability-worker-map.json");

    internal static string RepoRoot => FindRepoRoot();

    private static string FindRepoRoot()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);

        while (directory is not null)
        {
            if (File.Exists(Path.Combine(directory.FullName, "ArchLucid.sln")))
                return directory.FullName;

            directory = directory.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
