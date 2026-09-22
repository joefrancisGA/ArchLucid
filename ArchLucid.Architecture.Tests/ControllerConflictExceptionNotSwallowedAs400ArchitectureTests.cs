using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     <see cref="ArchLucid.Application.ConflictException" /> derives from <see cref="InvalidOperationException" />.
///     A controller <c>try</c> that catches <c>InvalidOperationException</c> and returns
///     <c>BadRequestProblem(ex.Message, …)</c> therefore turns every 409 business conflict (sealed manifest,
///     CAS mismatch, wrong lifecycle phase) into a 400 unless a <c>catch (ConflictException)</c> arm precedes it.
///     The global exception filter never sees the swallowed exception, so this guard enforces the arm order at
///     source level across every controller partial.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ControllerConflictExceptionNotSwallowedAs400ArchitectureTests
{
    private static readonly string ControllersRoot = Path.Combine(
        FindRepoRoot(),
        "ArchLucid.Api",
        "Controllers");

    private static readonly Regex InvalidOperationCatchRegex = new(
        @"^(?<indent>\s*)catch \(InvalidOperationException (?<name>\w+)\)\s*$",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromSeconds(1));

    [Fact]
    public void Controller_try_blocks_that_map_InvalidOperationException_to_400_catch_ConflictException_first()
    {
        List<string> violations = Directory
            .EnumerateFiles(ControllersRoot, "*.cs", SearchOption.AllDirectories)
            .SelectMany(FindUnguardedInvalidOperationCatches)
            .ToList();

        violations.Should().BeEmpty(
            "controller catch arms that return BadRequestProblem(ex.Message) for InvalidOperationException must be preceded by catch (ConflictException) in the same try, or use InvalidOperationProblem(ex, …), so ConflictException still maps to 409");
    }

    private static IEnumerable<string> FindUnguardedInvalidOperationCatches(string path)
    {
        string[] lines = File.ReadAllLines(path);

        for (int index = 0; index < lines.Length; index++)
        {
            Match match = InvalidOperationCatchRegex.Match(lines[index]);

            if (!match.Success)
                continue;

            if (!ReturnsBadRequestFromMessage(lines, index, match.Groups["name"].Value))
                continue;

            if (TryBlockCatchesConflictException(lines, index, match.Groups["indent"].Value.Length))
                continue;

            yield return $"{Path.GetRelativePath(ControllersRoot, path)}:{index + 1}";
        }
    }

    /// <summary>The offending shape is `return this.BadRequestProblem(ex.Message, …)` as the first statement.</summary>
    private static bool ReturnsBadRequestFromMessage(string[] lines, int catchLineIndex, string exceptionName)
    {
        string body = string.Join(" ", lines.Skip(catchLineIndex + 1).Take(3));

        return body.Contains($"BadRequestProblem({exceptionName}.Message", StringComparison.Ordinal);
    }

    /// <summary>Walks back to the `try` at the same indentation and looks for a ConflictException arm on the way.</summary>
    private static bool TryBlockCatchesConflictException(string[] lines, int catchLineIndex, int indent)
    {
        for (int index = catchLineIndex - 1; index >= 0; index--)
        {
            string line = lines[index];

            if (line.Contains("catch (ConflictException", StringComparison.Ordinal))
                return true;

            if (line.Trim() == "try" && line.Length - line.TrimStart().Length == indent)
                return false;
        }

        return false;
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
