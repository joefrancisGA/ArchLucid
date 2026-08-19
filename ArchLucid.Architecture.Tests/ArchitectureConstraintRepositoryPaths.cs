using System.Text.RegularExpressions;

using ArchLucid.TestSupport;

namespace ArchLucid.Architecture.Tests;

/// <summary>Repository-root and <c>*.csproj</c> lookups shared by the architecture constraint suites.</summary>
internal static class ArchitectureConstraintRepositoryPaths
{
    private static readonly Regex ProjectReferenceInclude = new(
        "<ProjectReference\\s+Include=\"([^\"]+)\"",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    // Walking the directory tree once per test run keeps the file-system probing off the per-rule path.
    private static readonly Lazy<string> LazyRepositoryRoot = new(LocateRepositoryRoot);

    /// <summary>Directory containing <c>ArchLucid.sln</c>.</summary>
    internal static string RepositoryRoot => LazyRepositoryRoot.Value;

    /// <summary>Path of <c>{projectName}/{projectName}.csproj</c> under the repository root.</summary>
    internal static string ProjectFilePath(string projectName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(projectName);

        return Path.Combine(RepositoryRoot, projectName, $"{projectName}.csproj");
    }

    /// <summary>Assembly names declared as <c>ProjectReference</c> by <paramref name="projectName"/>.</summary>
    internal static IReadOnlyList<string> DeclaredProjectReferences(string projectName)
        => ReadProjectReferenceAssemblyNames(ProjectFilePath(projectName));

    /// <summary>Assembly names declared as <c>ProjectReference</c> by the project file at <paramref name="csprojPath"/>.</summary>
    internal static IReadOnlyList<string> ReadProjectReferenceAssemblyNames(string csprojPath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(csprojPath);

        string text = File.ReadAllText(csprojPath);

        return ProjectReferenceInclude
            .Matches(text)
            .Where(static match => match.Success)
            .Select(static match => ReferencedProjectFolderName(match.Groups[1].Value))
            .Where(static name => !string.IsNullOrWhiteSpace(name))
            .ToArray();
    }

    /// <summary>
    /// <c>ProjectReference</c> includes are relative paths (for example <c>..\ArchLucid.Core\ArchLucid.Core.csproj</c>);
    /// the containing folder name is the referenced assembly name in this repository.
    /// </summary>
    private static string ReferencedProjectFolderName(string includePath)
    {
        string normalized = includePath.Replace('\\', '/');

        return Path.GetFileName(Path.GetDirectoryName(normalized.TrimEnd('/')) ?? normalized);
    }

    private static string LocateRepositoryRoot()
    {
        string? directory = Path.GetDirectoryName(typeof(ArchitectureConstraintRepositoryPaths).Assembly.Location);

        for (int step = 0; step < TestRepositoryPathLimits.MaxStepsFromTestAssemblyBinToSolutionFile && directory is not null; step++)
        {
            if (File.Exists(Path.Combine(directory, "ArchLucid.sln")))
            {
                return directory;
            }

            directory = Directory.GetParent(directory)?.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from the test assembly location.");
    }
}
