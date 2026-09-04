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
}
