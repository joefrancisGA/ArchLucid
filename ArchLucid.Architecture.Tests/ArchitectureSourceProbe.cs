using System.Text;

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
        return ReadPathWithPartials(path);
    }

    /// <summary>
    ///     Reads <paramref name="absolutePath"/> plus same-stem partials (<c>Foo.Bar.cs</c> next to <c>Foo.cs</c>)
    ///     so source ratchets survive extraction into partial files.
    /// </summary>
    internal static string ReadPathWithPartials(string absolutePath)
        => ReadPathWithPartials(absolutePath, Encoding.UTF8);

    internal static string ReadPathWithPartials(string absolutePath, Encoding encoding)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(absolutePath);
        ArgumentNullException.ThrowIfNull(encoding);

        if (!File.Exists(absolutePath))
            return File.ReadAllText(absolutePath, encoding);

        string extension = Path.GetExtension(absolutePath);
        if (!string.Equals(extension, ".cs", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(extension, ".ts", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(extension, ".tsx", StringComparison.OrdinalIgnoreCase))
        {
            return File.ReadAllText(absolutePath, encoding);
        }

        string? directory = Path.GetDirectoryName(absolutePath);
        if (string.IsNullOrWhiteSpace(directory))
            return File.ReadAllText(absolutePath, encoding);

        // Nested partials (Foo.Bar.cs) must also pull Foo.cs and Foo.Baz.cs so a ratchet
        // aimed at one slice still sees guards extracted onto sibling slices.
        HashSet<string> files = new(StringComparer.OrdinalIgnoreCase) { absolutePath };
        string fileName = Path.GetFileNameWithoutExtension(absolutePath);
        string[] stemParts = fileName.Split('.');

        for (int length = stemParts.Length; length >= 1; length--)
        {
            string candidateStem = string.Join('.', stemParts.Take(length));
            string primary = Path.Combine(directory, candidateStem + extension);

            if (File.Exists(primary))
                files.Add(primary);

            foreach (string sibling in Directory.GetFiles(
                directory,
                candidateStem + ".*" + extension,
                SearchOption.TopDirectoryOnly))
            {
                if (IsTestCompanion(sibling))
                    continue;

                files.Add(sibling);
            }
        }

        string[] ordered = files
            .OrderBy(static path => path, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return string.Join('\n', ordered.Select(path => File.ReadAllText(path, encoding)));
    }

    private static bool IsTestCompanion(string path)
    {
        string name = Path.GetFileName(path);

        return name.Contains(".test.", StringComparison.OrdinalIgnoreCase)
            || name.Contains(".spec.", StringComparison.OrdinalIgnoreCase)
            || name.EndsWith("Tests.cs", StringComparison.OrdinalIgnoreCase);
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

    internal static string ReadCommitOutputIntegrityPipeline()
    {
        return ReadFile("ArchLucid.Application", "Runs", "Orchestration", "CommitOutputIntegrityService.cs")
            + "\n"
            + ReadFile("ArchLucid.Application", "Governance", "CommitCreateTimePinIntegrityEvaluator.cs")
            + "\n"
            + ReadFile("ArchLucid.Application", "Governance", "CommitArchitectureVersionPinIntegrityEvaluator.cs")
            + "\n"
            + ReadFile("ArchLucid.Application", "Architecture", "ArchitectureVersionContentFingerprintVerifier.cs");
    }
}
