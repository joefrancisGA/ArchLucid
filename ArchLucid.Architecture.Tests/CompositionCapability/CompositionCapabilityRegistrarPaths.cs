namespace ArchLucid.Architecture.Tests.CompositionCapability;

internal static class CompositionCapabilityRegistrarPaths
{
    internal static string RootServiceCollectionExtensionsFile =>
        Path.Combine(
            RepoRoot,
            "ArchLucid.Host.Composition",
            "Startup",
            "ServiceCollectionExtensions.cs");

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
