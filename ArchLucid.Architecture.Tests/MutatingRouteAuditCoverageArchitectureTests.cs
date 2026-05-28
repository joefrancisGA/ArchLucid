using System.Diagnostics;
using System.Text;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guards POST/PUT/DELETE controller routes against silent audit-matrix drift.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class MutatingRouteAuditCoverageArchitectureTests
{
    private static string FindRepoRoot()
    {
        for (DirectoryInfo? d = new(AppContext.BaseDirectory); d != null; d = d.Parent)
        {
            string sln = Path.Combine(d.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
                return d.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from AppContext.BaseDirectory.");
    }

    [Fact]
    public void Mutating_controller_routes_are_documented_in_audit_coverage_matrix()
    {
        string root = FindRepoRoot();
        string scriptPath = Path.Combine(root, "scripts", "ci", "check_audit_matrix.py");

        File.Exists(scriptPath).Should().BeTrue("check_audit_matrix.py must exist for audit drift guard.");

        ProcessStartInfo startInfo = new()
        {
            FileName = "python",
            Arguments = $"\"{scriptPath}\"",
            WorkingDirectory = root,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using Process process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("Failed to start python for check_audit_matrix.py.");

        string stdout = process.StandardOutput.ReadToEnd();
        string stderr = process.StandardError.ReadToEnd();
        process.WaitForExit(TimeSpan.FromMinutes(2));

        StringBuilder detail = new();

        if (!string.IsNullOrWhiteSpace(stdout))
            detail.AppendLine(stdout.Trim());

        if (!string.IsNullOrWhiteSpace(stderr))
            detail.AppendLine(stderr.Trim());

        process.ExitCode.Should().Be(
            0,
            "undocumented mutating routes must appear in docs/library/AUDIT_COVERAGE_MATRIX.md, "
            + "scripts/ci/openapi_audit_matrix_allowlist.txt, or carry an explicit audit exemption:\n"
            + detail);
    }
}
