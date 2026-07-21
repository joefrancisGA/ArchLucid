using ArchLucid.Cli.Commands;

namespace ArchLucid.Cli.Stack;

/// <summary>Resolves TB-654 stack file locations relative to the repository root.</summary>
internal static class ArchlucidStackWorkspaceResolver
{
    internal static bool TryResolveRepositoryRoot(string? explicitRoot, [System.Diagnostics.CodeAnalysis.NotNullWhen(true)] out string? repositoryRoot)
    {
        if (!string.IsNullOrWhiteSpace(explicitRoot))
        {
            string full = Path.GetFullPath(explicitRoot);

            if (File.Exists(Path.Combine(full, "docs", "go-to-market", "AZURE_MARKETPLACE_SAAS_OFFER.md")))
            {
                repositoryRoot = full;

                return true;
            }

            repositoryRoot = null;

            return false;
        }

        repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        return repositoryRoot is not null;
    }

    internal static string ResolveAnswersPath(string repositoryRoot, string? explicitAnswersPath, bool fromExample)
    {
        if (fromExample)
            return Path.Combine(repositoryRoot, ArchlucidStackPaths.ExampleRelativePath);

        if (!string.IsNullOrWhiteSpace(explicitAnswersPath))
            return Path.GetFullPath(explicitAnswersPath);

        string cwdAnswers = Path.Combine(Environment.CurrentDirectory, ArchlucidStackPaths.DefaultAnswersFileName);

        if (File.Exists(cwdAnswers))
            return cwdAnswers;

        string deployAnswers = Path.Combine(repositoryRoot, "deploy", ArchlucidStackPaths.DefaultAnswersFileName);

        if (File.Exists(deployAnswers))
            return deployAnswers;

        return cwdAnswers;
    }

    internal static string ResolveOutputDirectory(string repositoryRoot, string? explicitOutputDirectory, string environment)
    {
        if (!string.IsNullOrWhiteSpace(explicitOutputDirectory))
            return Path.GetFullPath(explicitOutputDirectory);

        return Path.Combine(repositoryRoot, ArchlucidStackPaths.GeneratedRootRelativePath, environment);
    }
}
