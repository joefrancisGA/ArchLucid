namespace ArchLucid.Cli.Stack;

/// <summary>Parsed flags for <c>archlucid stack init</c>.</summary>
internal sealed class StackInitOptions
{
    public bool FromExample
    {
        get;
        init;
    }

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

    public bool Force
    {
        get;
        init;
    }

    public string? RepositoryRoot
    {
        get;
        init;
    }

    internal static bool TryParse(string[] args, out StackInitOptions? options, out string? error)
    {
        options = null;
        error = null;
        bool fromExample = false;
        bool force = false;
        string? answersPath = null;
        string? outputDirectory = null;
        string? repositoryRoot = null;

        for (int index = 0; index < args.Length; index++)
        {
            string token = args[index];

            if (string.Equals(token, "--from-example", StringComparison.OrdinalIgnoreCase))
            {
                fromExample = true;
                continue;
            }

            if (string.Equals(token, "--force", StringComparison.OrdinalIgnoreCase))
            {
                force = true;
                continue;
            }

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

        options = new StackInitOptions
        {
            FromExample = fromExample,
            AnswersPath = answersPath,
            OutputDirectory = outputDirectory,
            Force = force,
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
