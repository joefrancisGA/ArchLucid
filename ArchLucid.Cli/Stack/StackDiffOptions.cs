namespace ArchLucid.Cli.Stack;

/// <summary>Parsed flags for <c>archlucid stack diff</c>.</summary>
internal sealed class StackDiffOptions
{
    public string? AnswersPath
    {
        get;
        init;
    }

    public string? OutputDirectory
    {
        get;
        init;
    }

    public string? RepositoryRoot
    {
        get;
        init;
    }

    internal static bool TryParse(string[] args, out StackDiffOptions? options, out string? error)
    {
        options = null;
        error = null;
        string? answersPath = null;
        string? outputDirectory = null;
        string? repositoryRoot = null;

        for (int index = 0; index < args.Length; index++)
        {
            string token = args[index];

            if (string.Equals(token, "--answers", StringComparison.OrdinalIgnoreCase))
            {
                if (!TryReadNextValue(args, ref index, out answersPath, out error))
                    return false;

                continue;
            }

            if (string.Equals(token, "--out", StringComparison.OrdinalIgnoreCase))
            {
                if (!TryReadNextValue(args, ref index, out outputDirectory, out error))
                    return false;

                continue;
            }

            if (string.Equals(token, "--repo-root", StringComparison.OrdinalIgnoreCase))
            {
                if (!TryReadNextValue(args, ref index, out repositoryRoot, out error))
                    return false;

                continue;
            }

            error = $"Unknown argument: {token}";

            return false;
        }

        options = new StackDiffOptions
        {
            AnswersPath = answersPath,
            OutputDirectory = outputDirectory,
            RepositoryRoot = repositoryRoot,
        };

        return true;
    }

    private static bool TryReadNextValue(
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
        value = args[index];

        return true;
    }
}
