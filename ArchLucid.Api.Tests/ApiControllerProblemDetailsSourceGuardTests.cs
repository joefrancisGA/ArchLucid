using System.Text.RegularExpressions;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Regression guard: versioned API controllers should not return bare MVC <c>NotFound()</c> / <c>Conflict</c>,
///     bare numeric <c>StatusCode(404)</c>, or <c>StatusCode(StatusCodes.Status404NotFound)</c> without RFC 9457 Problem
///     Details (see <c>docs/API_ERROR_CONTRACT.md</c>).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ApiControllerProblemDetailsSourceGuardTests
{
    /// <summary>
    ///     Source shapes that bypass <c>ProblemDetailsExtensions</c>, paired with the remedy named in the failure.
    /// </summary>
    /// <remarks>
    ///     The 4xx-with-payload rule covers <c>StatusCode(StatusCodes.Status413PayloadTooLarge, new { … })</c>, which the
    ///     earlier single-argument rules missed: passing a body kept the response out of <c>problem+json</c> and so
    ///     without <c>correlationId</c> or <c>errorCode</c>. It is deliberately scoped to 4xx, because 5xx responses
    ///     carrying their own schema (health and upload endpoints) are a separate contract decision.
    /// </remarks>
    private static readonly (Regex Pattern, string Remedy)[] ForbiddenResultShapes =
    [
        (new Regex(@"\breturn\s+NotFound\s*\(", RegexOptions.CultureInvariant),
            "return NotFound(...) — use NotFoundProblem per RFC 9457"),
        (new Regex(@"\breturn\s+Conflict\s*\(", RegexOptions.CultureInvariant),
            "return Conflict(...) — use ConflictProblem per RFC 9457"),
        (new Regex(@"\breturn\s+BadRequest\s*\(", RegexOptions.CultureInvariant),
            "return BadRequest(...) — use BadRequestProblem per RFC 9457"),
        (new Regex(@"\breturn\s+StatusCode\s*\(\s*\d+\s*\)\s*;", RegexOptions.CultureInvariant),
            "bare StatusCode(nnn) — use a Problem helper per docs/API_ERROR_CONTRACT.md"),
        (new Regex(@"\breturn\s+StatusCode\s*\(\s*StatusCodes\.Status404NotFound\s*\)\s*;", RegexOptions.CultureInvariant),
            "return StatusCode(StatusCodes.Status404NotFound) — use NotFoundProblem per RFC 9457"),
        (new Regex(@"\breturn\s+StatusCode\s*\(\s*(?:StatusCodes\.Status4\d{2}\w*|4\d{2})\s*,", RegexOptions.CultureInvariant),
            "4xx StatusCode(...) with a response body — use a Problem helper so the body stays problem+json"),
        (new Regex(@"new\s+ObjectResult\s*\([^)]*\)\s*\{[^}]*StatusCode\s*=", RegexOptions.CultureInvariant),
            "ObjectResult with StatusCode property — prefer typed Problem() helpers")
    ];

    private static string ControllersDirectory()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            string sln = Path.Combine(dir.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
            {
                string controllers = Path.Combine(dir.FullName, "ArchLucid.Api", "Controllers");

                if (Directory.Exists(controllers))
                {
                    return controllers;
                }
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException(
            "Could not locate ArchLucid.sln / ArchLucid.Api/Controllers from test base directory.");
    }

    [SkippableFact]
    public void Controller_sources_must_not_bypass_problem_details_helpers()
    {
        string root = ControllersDirectory();
        string[] files = Directory.GetFiles(root, "*.cs", SearchOption.AllDirectories);
        files.Length.Should().BeGreaterThan(0);

        List<string> violations = files
            .SelectMany(file => FindViolations(file))
            .ToList();

        violations.Should().BeEmpty(
            "use ProblemDetailsExtensions (e.g. NotFoundProblem, ConflictProblem) per docs/API_ERROR_CONTRACT.md: " +
            string.Join("; ", violations));
    }

    private static IEnumerable<string> FindViolations(string file)
    {
        string text = File.ReadAllText(file);

        return ForbiddenResultShapes
            .Where(shape => shape.Pattern.IsMatch(text))
            .Select(shape => $"{file}: {shape.Remedy}");
    }
}
