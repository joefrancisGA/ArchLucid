namespace ArchLucid.Cli.Commands;

/// <summary>AS-083 — parsed arguments for <see cref="TryCommand" /> (ADR 0033 + ADR 0086). Default door is Rehearsal.</summary>
internal sealed class TryCommandOptions
{
    public const string ArchLucidRealAoaiEnv = "ARCHLUCID_REAL_AOAI";

    public TryCommandExecutionDoor Door
    {
        get;
        init;
    } = TryCommandExecutionDoor.Rehearsal;

    public bool StrictReal
    {
        get;
        init;
    }

    public bool ShowHelp
    {
        get;
        init;
    }

    /// <summary>Arguments forwarded to <c>real-mode smoke</c> after door resolution.</summary>
    public string[] ForwardedSmokeArgs
    {
        get;
        init;
    } = [];

    public bool HasForwardedSmokeArgs => ForwardedSmokeArgs.Length > 0;

    /// <summary>Hosted smoke target — skips the local <see cref="ArchLucidRealAoaiEnv" /> gate.</summary>
    public bool IsHostedSmokeTarget =>
        ForwardedSmokeArgs.Any(static arg =>
            string.Equals(arg, "--staging", StringComparison.OrdinalIgnoreCase)
            || string.Equals(arg, "--api-base-url", StringComparison.OrdinalIgnoreCase));

    /// <summary>ADR 0033 local safety gate for Career door semantics.</summary>
    public bool IsPilotRealAzureOpenAiAttempt =>
        Door == TryCommandExecutionDoor.Career
        && string.Equals(Environment.GetEnvironmentVariable(ArchLucidRealAoaiEnv)?.Trim(), "1", StringComparison.Ordinal);

    public static TryCommandOptions? Parse(string[] args, out string? error)
    {
        ArgumentNullException.ThrowIfNull(args);

        bool showHelp = false;
        bool realMode = false;
        bool rehearseMode = false;
        bool strictReal = false;
        List<string> forwarded = [];

        for (int i = 0; i < args.Length; i++)
        {
            string current = args[i];

            switch (current)
            {
                case "--help":
                case "-h":
                    showHelp = true;
                    break;

                case "--real":
                    realMode = true;
                    break;

                case "--rehearse":
                    rehearseMode = true;
                    break;

                case "--strict-real":
                    strictReal = true;
                    break;

                default:
                    forwarded.Add(current);
                    break;
            }
        }

        if (realMode && rehearseMode)
        {
            error = "Cannot combine --real (Record review type) and --rehearse (Practice review type). Pick one review type.";

            return null;
        }

        if (strictReal && !realMode)
        {
            error = "--strict-real requires --real (Record review type).";

            return null;
        }

        TryCommandExecutionDoor door = realMode ? TryCommandExecutionDoor.Career : TryCommandExecutionDoor.Rehearsal;

        error = null;

        return new TryCommandOptions
        {
            Door = door,
            StrictReal = strictReal,
            ShowHelp = showHelp,
            ForwardedSmokeArgs = forwarded.ToArray(),
        };
    }
}
