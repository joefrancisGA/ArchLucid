using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Reads split partials as one scan target so robustness guards survive file extraction.
/// </summary>
internal static class ArchitectureSourceProbe
{
    internal static string RepoRoot { get; } =
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    internal static string ReadFile(params string[] relativeSegments)
    {
        string path = Path.Combine(new[] { RepoRoot }.Concat(relativeSegments).ToArray());
        File.Exists(path).Should().BeTrue($"expected source at {path}");
        return File.ReadAllText(path);
    }

    internal static string ReadMatching(string relativeDirectory, string searchPattern)
    {
        string directory = Path.Combine(
            RepoRoot,
            relativeDirectory.Replace('/', Path.DirectorySeparatorChar));

        Directory.Exists(directory).Should().BeTrue($"expected directory {directory}");

        string[] files = Directory
            .GetFiles(directory, searchPattern, SearchOption.TopDirectoryOnly)
            .OrderBy(static path => path, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        files.Should().NotBeEmpty($"expected {searchPattern} under {relativeDirectory}");
        return string.Join('\n', files.Select(File.ReadAllText));
    }

    internal static string ReadFindingsPipeline()
    {
        return ReadFile("ArchLucid.Decisioning", "Services", "FindingsOrchestrator.cs")
            + "\n"
            + ReadMatching("ArchLucid.Decisioning/Services/Findings", "*.cs");
    }

    internal static string ReadExecuteOrchestratorPipeline()
    {
        return ReadFile("ArchLucid.Application", "Runs", "Orchestration", "ArchitectureRunExecuteOrchestrator.cs")
            + "\n"
            + ReadMatching("ArchLucid.Application/Runs/Orchestration/Execute", "*.cs");
    }

    internal static string ReadFindingAnalysisContextBuilder()
    {
        return ReadMatching(
            "ArchLucid.Application/Runs/Orchestration/Pipeline",
            "FindingAnalysisContextBuilder*.cs");
    }

    /// <summary>
    ///     Reads the named file first, then the type's primary file and <c>TypeName.*.cs</c> partials.
    ///     Non-<c>.cs</c> paths stay exact so markdown/TS ratchets are not globbed as C#.
    /// </summary>
    internal static string ReadCsTypeFamily(string relativeFilePath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(relativeFilePath);

        string normalized = relativeFilePath.Replace('\\', '/');
        string[] segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);
        string exactPath = Path.Combine(new[] { RepoRoot }.Concat(segments).ToArray());
        File.Exists(exactPath).Should().BeTrue($"expected source at {exactPath}");

        string extension = Path.GetExtension(normalized);

        if (!string.Equals(extension, ".cs", StringComparison.OrdinalIgnoreCase))
            return File.ReadAllText(exactPath);

        int lastSlash = normalized.LastIndexOf('/');
        string directoryRel = lastSlash < 0 ? string.Empty : normalized[..lastSlash];
        string fileName = lastSlash < 0 ? normalized : normalized[(lastSlash + 1)..];
        string typeName = fileName.Split('.')[0];
        string directory = Path.Combine(RepoRoot, directoryRel.Replace('/', Path.DirectorySeparatorChar));

        List<string> files = [exactPath];
        string primary = Path.Combine(directory, typeName + ".cs");

        if (File.Exists(primary) && !PathsEqual(primary, exactPath))
            files.Add(primary);

        if (Directory.Exists(directory))
        {

            foreach (string partial in Directory
                         .GetFiles(directory, typeName + ".*.cs", SearchOption.TopDirectoryOnly)
                         .OrderBy(static path => path, StringComparer.OrdinalIgnoreCase))
            {

                if (files.Any(existing => PathsEqual(existing, partial)))
                    continue;

                files.Add(partial);
            }
        }

        return string.Join('\n', files.Select(File.ReadAllText));
    }

    /// <summary>
    ///     Commit integrity after evaluator extraction: orchestrator plus create-time and architecture-version pins.
    /// </summary>
    internal static string ReadCommitIntegrityFamily()
    {
        return ReadCsTypeFamily("ArchLucid.Application/Runs/Orchestration/CommitOutputIntegrityService.cs")
            + "\n"
            + ReadCsTypeFamily("ArchLucid.Application/Governance/CommitCreateTimePinIntegrityEvaluator.cs")
            + "\n"
            + ReadCsTypeFamily("ArchLucid.Application/Governance/CommitArchitectureVersionPinIntegrityEvaluator.cs");
    }

    private static bool PathsEqual(string left, string right) =>
        string.Equals(left, right, StringComparison.OrdinalIgnoreCase);

    internal static void ShouldUseSealedManifestAwareRead(string source)
    {
        ArgumentNullException.ThrowIfNull(source);

        bool sealedAware = source.Contains("apiGetSealedManifestAware", StringComparison.Ordinal)
            || source.Contains("formatExportSealedManifestAwareApiError", StringComparison.Ordinal);

        sealedAware.Should().BeTrue(
            "client must keep a sealed-manifest-aware GET or the shared 409 formatter");
    }
}
