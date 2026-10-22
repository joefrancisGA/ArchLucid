using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Cli.Commands;

/// <summary>Locates the ArchLucid repository root for git metadata and operator docs (looks for <c>ArchLucid.sln</c>).</summary>
internal static class DeploymentEvidenceRepositoryRootResolver
{
    private const string SolutionFileName = "ArchLucid.sln";

    internal static bool TryResolve(string? explicitRoot, string searchFromDirectory,
        [NotNullWhen(true)] out string? repositoryRoot)
    {
        repositoryRoot = null;

        if (!string.IsNullOrWhiteSpace(explicitRoot))
        {
            string rooted = Path.GetFullPath(explicitRoot);
            string sln = Path.Combine(rooted, SolutionFileName);

            if (!File.Exists(sln))
                return false;

            repositoryRoot = rooted;

            return true;
        }

        DirectoryInfo? directory = new(searchFromDirectory);

        for (int ascent = 0; ascent < 32 && directory is not null; ascent++)
        {
            string candidate = Path.Combine(directory.FullName, SolutionFileName);

            if (File.Exists(candidate))
            {
                repositoryRoot = directory.FullName;

                return true;
            }

            directory = directory.Parent;
        }

        return false;
    }
}
