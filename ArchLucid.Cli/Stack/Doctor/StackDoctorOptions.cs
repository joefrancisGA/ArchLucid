namespace ArchLucid.Cli.Stack.Doctor;

internal sealed class StackDoctorOptions
{
    internal string? Profile { get; set; }

    internal string? AnswersPath { get; set; }

    internal string? RepositoryRoot { get; set; }

    internal string? ApiBaseUrl { get; set; }

    internal string DeploymentEnvironment { get; set; } = "staging";

    internal bool JsonStdout { get; set; }

    internal string? JsonOutPath { get; set; }

    internal string? MarkdownOutPath { get; set; }

    internal static bool TryParse(string[] args, out StackDoctorOptions? options, out string? error)
    {
        options = null;
        error = null;

        if (args is null)
        {
            error = "Arguments are required.";

            return false;
        }

        StackDoctorOptions parsed = new();

        for (int index = 0; index < args.Length; index++)
        {
            string token = args[index];

            if (token is "--help" or "-h" or "/?")
            {
                options = parsed;

                return true;
            }

            if (string.Equals(token, "--profile", StringComparison.OrdinalIgnoreCase))
            {
                if (!TryReadValue(args, ref index, out string? value, out error))
                    return false;

                parsed.Profile = value;

                continue;
            }

            if (string.Equals(token, "--answers", StringComparison.OrdinalIgnoreCase))
            {
                if (!TryReadValue(args, ref index, out string? value, out error))
                    return false;

                parsed.AnswersPath = value;

                continue;
            }

            if (string.Equals(token, "--repo-root", StringComparison.OrdinalIgnoreCase))
            {
                if (!TryReadValue(args, ref index, out string? value, out error))
                    return false;

                parsed.RepositoryRoot = value;

                continue;
            }

            if (string.Equals(token, "--api-base-url", StringComparison.OrdinalIgnoreCase))
            {
                if (!TryReadValue(args, ref index, out string? value, out error))
                    return false;

                parsed.ApiBaseUrl = value;

                continue;
            }

            if (string.Equals(token, "--environment", StringComparison.OrdinalIgnoreCase))
            {
                if (!TryReadValue(args, ref index, out string? value, out error))
                    return false;

                parsed.DeploymentEnvironment = value!;

                continue;
            }

            if (string.Equals(token, "--json", StringComparison.OrdinalIgnoreCase))
            {
                parsed.JsonStdout = true;

                continue;
            }

            if (string.Equals(token, "--json-out", StringComparison.OrdinalIgnoreCase))
            {
                if (!TryReadValue(args, ref index, out string? value, out error))
                    return false;

                parsed.JsonOutPath = value;

                continue;
            }

            if (string.Equals(token, "--markdown-out", StringComparison.OrdinalIgnoreCase))
            {
                if (!TryReadValue(args, ref index, out string? value, out error))
                    return false;

                parsed.MarkdownOutPath = value;

                continue;
            }

            error = $"Unknown argument: {token}";

            return false;
        }

        options = parsed;

        return true;
    }

    private static bool TryReadValue(
        string[] args,
        ref int index,
        out string? value,
        out string? error)
    {
        value = null;
        error = null;

        if (index + 1 >= args.Length)
        {
            error = $"Missing value after {args[index]}.";

            return false;
        }

        index++;
        value = args[index].Trim();

        if (string.IsNullOrWhiteSpace(value))
        {
            error = $"Empty value after {args[index - 1]}.";

            return false;
        }

        return true;
    }
}
