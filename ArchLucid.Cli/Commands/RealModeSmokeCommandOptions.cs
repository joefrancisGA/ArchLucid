using System.Globalization;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Parsed arguments for <c>archlucid real-mode smoke</c>. Pure parsing (no I/O) so it is unit-testable.
/// </summary>
public sealed class RealModeSmokeCommandOptions
{
    /// <summary>
    ///     Canonical staging API host targeted by <c>--staging</c>. Keep aligned with
    ///     <c>docs/runbooks/REAL_MODE_STAGING_SMOKE.md</c> and <see cref="TrialSmokeCommandOptions.StagingApiBaseUrl" />.
    /// </summary>
    public const string StagingApiBaseUrl = TrialSmokeCommandOptions.StagingApiBaseUrl;

    public const int DefaultTimeoutSeconds = 300;

    public const int DefaultPollIntervalSeconds = 3;

    public string? ApiBaseUrl
    {
        get;
        init;
    }

    public bool TargetStaging
    {
        get;
        init;
    }

    public bool OneLineOutput
    {
        get;
        init;
    }

    /// <summary>
    ///     When true (default for <c>--staging</c>), fail if the run reaches ReadyForCommit without persisted LLM token usage —
    ///     a cheap signal that staging executed agents in real mode rather than simulator-only.
    /// </summary>
    public bool RequireRealExecutionTokens
    {
        get;
        init;
    }

    public int TimeoutSeconds
    {
        get;
        init;
    } = DefaultTimeoutSeconds;

    public int PollIntervalSeconds
    {
        get;
        init;
    } = DefaultPollIntervalSeconds;

    public static RealModeSmokeCommandOptions? Parse(string[] args, out string? error)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        string? apiBaseUrl = null;
        bool targetStaging = false;
        bool oneLine = false;
        bool allowSimulator = false;
        int timeoutSeconds = DefaultTimeoutSeconds;
        int pollIntervalSeconds = DefaultPollIntervalSeconds;

        for (int i = 0; i < args.Length; i++)
        {
            string arg = args[i];

            switch (arg)
            {
                case "--api-base-url":
                    if (!TryReadValue(args, ref i, arg, out string? apiVal, out error))
                        return null;

                    apiBaseUrl = apiVal;
                    break;

                case "--staging":
                    targetStaging = true;
                    break;

                case "--one-line":
                    oneLine = true;
                    break;

                case "--allow-simulator":
                    allowSimulator = true;
                    break;

                case "--timeout-seconds":
                    if (!TryReadValue(args, ref i, arg, out string? timeoutVal, out error))
                        return null;

                    if (!int.TryParse(timeoutVal, NumberStyles.Integer, CultureInfo.InvariantCulture, out int timeout) ||
                        timeout < 10 || timeout > 1800)
                    {
                        error =
                            $"Invalid value for --timeout-seconds: '{timeoutVal}'. Expected an integer between 10 and 1800.";

                        return null;
                    }

                    timeoutSeconds = timeout;
                    break;

                case "--poll-interval-seconds":
                    if (!TryReadValue(args, ref i, arg, out string? pollVal, out error))
                        return null;

                    if (!int.TryParse(pollVal, NumberStyles.Integer, CultureInfo.InvariantCulture, out int poll) ||
                        poll < 1 || poll > 30)
                    {
                        error =
                            $"Invalid value for --poll-interval-seconds: '{pollVal}'. Expected an integer between 1 and 30.";

                        return null;
                    }

                    pollIntervalSeconds = poll;
                    break;

                default:
                    error = $"Unknown flag: {arg}. Try `archlucid real-mode smoke --help`.";
                    return null;
            }
        }

        if (targetStaging && !string.IsNullOrWhiteSpace(apiBaseUrl) &&
            !string.Equals(apiBaseUrl.Trim().TrimEnd('/'), StagingApiBaseUrl, StringComparison.OrdinalIgnoreCase))
        {
            error = $"--staging cannot be combined with a different --api-base-url ('{apiBaseUrl}'). Drop one.";
            return null;
        }

        if (targetStaging && string.IsNullOrWhiteSpace(apiBaseUrl))
            apiBaseUrl = StagingApiBaseUrl;

        bool requireRealTokens;

        if (targetStaging)
            requireRealTokens = !allowSimulator;
        else
            requireRealTokens = false;

        error = null;

        return new RealModeSmokeCommandOptions
        {
            ApiBaseUrl = apiBaseUrl,
            TargetStaging = targetStaging,
            OneLineOutput = oneLine || targetStaging,
            RequireRealExecutionTokens = requireRealTokens,
            TimeoutSeconds = timeoutSeconds,
            PollIntervalSeconds = pollIntervalSeconds
        };
    }

    private static bool TryReadValue(string[] args, ref int i, string flag, out string? value, out string? error)
    {
        if (i + 1 >= args.Length)
        {
            value = null;
            error = $"Missing value for {flag}.";
            return false;
        }

        i++;
        value = args[i];
        error = null;
        return true;
    }
}
