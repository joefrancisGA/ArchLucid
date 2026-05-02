namespace ArchLucid.Persistence.Tests;

/// <summary>Lifts repo-relative paths for tests that read committed files at the solution root (TB-003 allowlist).</summary>
internal static class PersistenceTestsRepositoryPaths
{
    internal static string ResolveRepositoryRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            string candidate = Path.Combine(dir.FullName, "ArchLucid.sln");

            if (File.Exists(candidate))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException(
            "Locate ArchLucid.sln from bin output (tests must execute from compiled output beneath the repo root containing tests/performance).");
    }
}
