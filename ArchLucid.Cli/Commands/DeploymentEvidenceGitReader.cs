using System.Diagnostics;

namespace ArchLucid.Cli.Commands;

/// <summary>Resolves local git HEAD for evidence reports; prefers <c>GITHUB_SHA</c> in Actions when set.</summary>
internal static class DeploymentEvidenceGitReader
{
    internal static string? TryReadHeadSha(string repositoryRoot)
    {
        string? fromActions = Environment.GetEnvironmentVariable("GITHUB_SHA");

        return !string.IsNullOrWhiteSpace(fromActions) ? fromActions.Trim() : TryRunGit(repositoryRoot, "rev-parse", "HEAD");
    }

    internal static bool? TryReadDirty(string repositoryRoot)
    {
        string? porcelain = TryRunGit(repositoryRoot, "status", "--porcelain");
        if (porcelain is null)
            return null;

        return porcelain.Length > 0;
    }

    private static string? TryRunGit(string workingDirectory, params string[] args)
    {
        try
        {
            ProcessStartInfo psi = new()
            {
                FileName = "git",
                WorkingDirectory = workingDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            foreach (string a in args)
                psi.ArgumentList.Add(a);

            using Process? p = Process.Start(psi);
            if (p is null)
                return null;

            string stdout = p.StandardOutput.ReadToEnd();
            p.WaitForExit(15_000);

            return p.ExitCode == 0 ? stdout.Trim() : null;
        }
        catch
        {
            return null;
        }
    }
}
