namespace ArchLucid.Cli.Commands;

/// <summary>Parsed flags for <c>archlucid draft new</c>.</summary>
internal sealed class DraftNewCommandOptions
{
    public string? IntentText
    {
        get;
        init;
    }

    public string? SystemName
    {
        get;
        init;
    }

    public string? BusinessOutcome
    {
        get;
        init;
    }

    public string ApiBaseUrl
    {
        get;
        init;
    } = string.Empty;

    public bool ApiBaseUrlFromArgument
    {
        get;
        init;
    }

    public bool SkipMustQuestions
    {
        get;
        init;
    }

    public bool NoAutoExecute
    {
        get;
        init;
    }

    public static DraftNewCommandOptions? Parse(string[] args, out string? error)
    {
        error = null;
        string? intentText = null;
        string? systemName = null;
        string? businessOutcome = null;
        string apiBaseUrl = string.Empty;
        bool apiBaseUrlFromArgument = false;
        bool skipMustQuestions = false;
        bool noAutoExecute = false;

        for (int index = 0; index < args.Length; index++)
        {
            string current = args[index];

            if (string.Equals(current, "--text", StringComparison.OrdinalIgnoreCase))
            {
                if (index + 1 >= args.Length)
                {
                    error = "Missing value for --text.";

                    return null;
                }

                intentText = args[++index];

                continue;
            }

            if (string.Equals(current, "--system-name", StringComparison.OrdinalIgnoreCase))
            {
                if (index + 1 >= args.Length)
                {
                    error = "Missing value for --system-name.";

                    return null;
                }

                systemName = args[++index];

                continue;
            }

            if (string.Equals(current, "--business-outcome", StringComparison.OrdinalIgnoreCase))
            {
                if (index + 1 >= args.Length)
                {
                    error = "Missing value for --business-outcome.";

                    return null;
                }

                businessOutcome = args[++index];

                continue;
            }

            if (string.Equals(current, "--api-base-url", StringComparison.OrdinalIgnoreCase))
            {
                if (index + 1 >= args.Length)
                {
                    error = "Missing value for --api-base-url.";

                    return null;
                }

                apiBaseUrl = args[++index].Trim().TrimEnd('/');
                apiBaseUrlFromArgument = true;

                continue;
            }

            if (string.Equals(current, "--skip-must-questions", StringComparison.OrdinalIgnoreCase))
            {
                skipMustQuestions = true;

                continue;
            }

            if (string.Equals(current, "--no-auto-execute", StringComparison.OrdinalIgnoreCase))
            {
                noAutoExecute = true;

                continue;
            }

            error = $"Unknown argument for 'draft new': {current}.";

            return null;
        }

        return new DraftNewCommandOptions
        {
            IntentText = intentText,
            SystemName = systemName,
            BusinessOutcome = businessOutcome,
            ApiBaseUrl = apiBaseUrl,
            ApiBaseUrlFromArgument = apiBaseUrlFromArgument,
            SkipMustQuestions = skipMustQuestions,
            NoAutoExecute = noAutoExecute,
        };
    }

    public static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid draft new [--text <intent>] [--system-name <name>] [--business-outcome <text>] "
            + "[--api-base-url <url>] [--skip-must-questions] [--no-auto-execute]");
    }
}
