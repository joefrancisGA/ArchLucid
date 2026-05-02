namespace ArchLucid.Core.Tests;

/// <summary>Locates the repo root for tests that read committed docs or JSON fixtures (not copied to output).</summary>
internal static class TestRepositoryPaths
{
    internal static string ResolveRepositoryRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            string sln = Path.Combine(dir.FullName, "ArchLucid.sln");
            if (File.Exists(sln))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException(
            "Could not locate repository root (ArchLucid.sln). Run tests from the built output layout under the solution directory.");
    }
}
