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

    public static DraftNewCommandOptions? Parse(string[] args, out string? error) =>
        DraftNewCommandArgParser.Parse(args, out error);

    public static void WriteUsage()
    {
        Console.WriteLine(
            "Usage: archlucid draft new [--text <intent>] [--system-name <name>] [--business-outcome <text>] "
            + "[--api-base-url <url>] [--skip-must-questions] [--no-auto-execute]");
    }
}
