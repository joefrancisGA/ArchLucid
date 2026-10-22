using System.Globalization;

namespace ArchLucid.ReviewApiHarness;

/// <summary>Pure argument parser for <see cref="JourneyOptions"/> (no I/O).</summary>
public static class JourneyOptionsParser
{
    public static JourneyOptions? Parse(string[] args, out string? error)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        string? apiBaseUrl = null;
        string? fromFile = null;
        string? jsonOut = null;
        string? openApiPath = null;
        int timeoutSeconds = JourneyOptions.DefaultTimeoutSeconds;
        int pollIntervalSeconds = JourneyOptions.DefaultPollIntervalSeconds;
        string submitterName = JourneyOptions.DefaultSubmitterActorName;
        string submitterId = JourneyOptions.DefaultSubmitterActorId;
        string reviewerName = JourneyOptions.DefaultReviewerActorName;
        string reviewerId = JourneyOptions.DefaultReviewerActorId;

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

                case "--from-file":
                    if (!TryReadValue(args, ref i, arg, out string? fileVal, out error))
                        return null;

                    fromFile = fileVal;
                    break;

                case "--json-out":
                    if (!TryReadValue(args, ref i, arg, out string? outVal, out error))
                        return null;

                    jsonOut = outVal;
                    break;

                case "--openapi-snapshot":
                    if (!TryReadValue(args, ref i, arg, out string? snapVal, out error))
                        return null;

                    openApiPath = snapVal;
                    break;

                case "--timeout-seconds":
                    if (!TryReadInt(args, ref i, arg, 60, 3600, out timeoutSeconds, out error))
                        return null;

                    break;

                case "--poll-interval-seconds":
                    if (!TryReadInt(args, ref i, arg, 1, 30, out pollIntervalSeconds, out error))
                        return null;

                    break;

                case "--submitter-actor-name":
                    if (!TryReadValue(args, ref i, arg, out string? sn, out error))
                        return null;

                    submitterName = sn!;
                    break;

                case "--submitter-actor-id":
                    if (!TryReadValue(args, ref i, arg, out string? si, out error))
                        return null;

                    submitterId = si!;
                    break;

                case "--reviewer-actor-name":
                    if (!TryReadValue(args, ref i, arg, out string? rn, out error))
                        return null;

                    reviewerName = rn!;
                    break;

                case "--reviewer-actor-id":
                    if (!TryReadValue(args, ref i, arg, out string? ri, out error))
                        return null;

                    reviewerId = ri!;
                    break;

                case "--help":
                case "-h":
                case "/?":
                    error = null;
                    return null;

                default:
                    error = $"Unknown flag: {arg}. Try --help.";
                    return null;
            }
        }

        if (string.IsNullOrWhiteSpace(apiBaseUrl))
        {
            string? envUrl = Environment.GetEnvironmentVariable("ARCHLUCID_API_URL");

            if (!string.IsNullOrWhiteSpace(envUrl))
                apiBaseUrl = envUrl;
        }

        if (string.IsNullOrWhiteSpace(apiBaseUrl))
        {
            error =
                "Missing API base URL. Pass --api-base-url <url> or set ARCHLUCID_API_URL.";

            return null;
        }

        error = null;

        return new JourneyOptions
        {
            ApiBaseUrl = apiBaseUrl.Trim().TrimEnd('/'),
            ArchitectureRequestJsonPath = fromFile,
            JsonOutPath = jsonOut,
            OpenApiSnapshotPath = openApiPath,
            TimeoutSeconds = timeoutSeconds,
            PollIntervalSeconds = pollIntervalSeconds,
            SubmitterActorName = submitterName.Trim(),
            SubmitterActorId = submitterId.Trim(),
            ReviewerActorName = reviewerName.Trim(),
            ReviewerActorId = reviewerId.Trim()
        };
    }

    public static void WriteUsage(TextWriter writer)
    {
        writer.WriteLine(
            "Usage: ArchLucid.ReviewApiHarness --api-base-url <url> [--from-file <request.json>] " +
            "[--timeout-seconds <n>] [--poll-interval-seconds <n>] [--json-out <path>] " +
            "[--openapi-snapshot <path>] [--submitter-actor-name <name>] [--submitter-actor-id <id>] " +
            "[--reviewer-actor-name <name>] [--reviewer-actor-id <id>]");
        writer.WriteLine();
        writer.WriteLine("Requires a live API with real AI (AgentExecution:Mode=Real). Simulator runs fail the gate.");
        writer.WriteLine("Auth: ARCHLUCID_API_KEY (X-Api-Key) and/or ARCHLUCID_BEARER_TOKEN (Authorization: Bearer).");
    }

    private static bool TryReadValue(
        string[] args,
        ref int i,
        string flag,
        out string? value,
        out string? error)
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

    private static bool TryReadInt(
        string[] args,
        ref int i,
        string flag,
        int minInclusive,
        int maxInclusive,
        out int value,
        out string? error)
    {
        value = 0;

        if (!TryReadValue(args, ref i, flag, out string? raw, out error))
            return false;

        if (!int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value) ||
            value < minInclusive ||
            value > maxInclusive)
        {
            error =
                $"Invalid value for {flag}: '{raw}'. Expected an integer between {minInclusive} and {maxInclusive}.";

            return false;
        }

        error = null;
        return true;
    }
}
