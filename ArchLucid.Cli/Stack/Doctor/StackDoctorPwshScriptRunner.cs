using System.Diagnostics;

namespace ArchLucid.Cli.Stack.Doctor;

internal static class StackDoctorPwshScriptRunner
{
    internal static async Task<(int ExitCode, string CombinedOutput)> RunAsync(
        string repositoryRoot,
        string scriptRelativePath,
        IReadOnlyList<string> scriptArguments,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);
        ArgumentException.ThrowIfNullOrWhiteSpace(scriptRelativePath);

        string scriptPath = Path.Combine(repositoryRoot, scriptRelativePath);

        if (!File.Exists(scriptPath))
            return (2, $"Script not found: {scriptRelativePath}");

        List<string> psArgs =
        [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            scriptPath,
        ];

        foreach (string argument in scriptArguments)
            psArgs.Add(argument);

        ProcessStartInfo psi = new()
        {
            FileName = "pwsh",
            Arguments = string.Join(" ", psArgs.Select(QuoteArg)),
            WorkingDirectory = repositoryRoot,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };

        using Process process = new() { StartInfo = psi };

        if (!process.Start())
            return (2, "Failed to start pwsh.");

        Task<string> stdoutTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
        Task<string> stderrTask = process.StandardError.ReadToEndAsync(cancellationToken);

        await process.WaitForExitAsync(cancellationToken).ConfigureAwait(false);

        string stdout = await stdoutTask.ConfigureAwait(false);
        string stderr = await stderrTask.ConfigureAwait(false);
        string combined = string.IsNullOrWhiteSpace(stderr)
            ? stdout.Trim()
            : $"{stdout.Trim()}\n{stderr.Trim()}".Trim();

        return (process.ExitCode, combined);
    }

    private static string QuoteArg(string value)
    {
        if (string.IsNullOrEmpty(value))
            return "\"\"";

        if (!value.Contains(' ') && !value.Contains('"'))
            return value;

        return "\"" + value.Replace("\"", "\\\"", StringComparison.Ordinal) + "\"";
    }
}
