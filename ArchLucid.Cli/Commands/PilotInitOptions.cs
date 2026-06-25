namespace ArchLucid.Cli.Commands;

internal sealed class PilotInitOptions
{
    public required string BaseUrl
    {
        get;
        init;
    }

    public bool SimulateProduction
    {
        get;
        init;
    } = true;

    public string? BearerToken
    {
        get;
        init;
    }

    public bool SkipTokenTest
    {
        get;
        init;
    }

    public bool RunOpenAiSmoke
    {
        get;
        init;
    }

    public string ReportOutputPath
    {
        get;
        init;
    } = PilotInitReportBuilder.DefaultReportFileName;

    internal static bool TryParse(string[] args, out PilotInitOptions? options, out string? error)
    {
        options = null;
        error = null;

        bool simulateProduction = true;
        bool skipTokenTest = false;
        bool runOpenAiSmoke = false;
        bool openAiSmokeExplicit = false;
        string? bearerToken = null;
        string? apiBaseUrl = null;
        string reportPath = PilotInitReportBuilder.DefaultReportFileName;

        for (int i = 0; i < args.Length; i++)
        {
            string arg = args[i];

            if (string.Equals(arg, "--local-lab", StringComparison.OrdinalIgnoreCase))
            {
                simulateProduction = false;

                continue;
            }

            if (string.Equals(arg, "--simulate-production", StringComparison.OrdinalIgnoreCase))
            {
                simulateProduction = true;

                continue;
            }

            if (string.Equals(arg, "--skip-token-test", StringComparison.OrdinalIgnoreCase))
            {
                skipTokenTest = true;

                continue;
            }

            if (string.Equals(arg, "--openai-smoke", StringComparison.OrdinalIgnoreCase))
            {
                runOpenAiSmoke = true;
                openAiSmokeExplicit = true;

                continue;
            }

            if (string.Equals(arg, "--skip-openai-smoke", StringComparison.OrdinalIgnoreCase))
            {
                runOpenAiSmoke = false;
                openAiSmokeExplicit = true;

                continue;
            }

            if (string.Equals(arg, "--bearer", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    error = "Missing value for --bearer.";

                    return false;
                }

                bearerToken = args[++i];

                continue;
            }

            if (string.Equals(arg, "--api-base-url", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    error = "Missing value for --api-base-url.";

                    return false;
                }

                apiBaseUrl = args[++i];

                continue;
            }

            if (string.Equals(arg, "--out", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    error = "Missing value for --out.";

                    return false;
                }

                reportPath = args[++i];

                continue;
            }

            error = $"Unexpected argument: {arg}";

            return false;
        }

        if (string.IsNullOrWhiteSpace(bearerToken))
        {
            bearerToken = Environment.GetEnvironmentVariable("ARCHLUCID_PILOT_BEARER_TOKEN");
        }

        if (!openAiSmokeExplicit)
            runOpenAiSmoke = simulateProduction;

        ArchLucidProjectScaffolder.ArchLucidCliConfig? config = CliCommandShared.TryLoadConfigFromCwd();
        string baseUrl = string.IsNullOrWhiteSpace(apiBaseUrl)
            ? CliAuthorizedHttpClient.ResolveBaseUrl([], config)
            : apiBaseUrl.Trim();

        options = new PilotInitOptions
        {
            BaseUrl = baseUrl,
            SimulateProduction = simulateProduction,
            BearerToken = bearerToken,
            SkipTokenTest = skipTokenTest,
            RunOpenAiSmoke = runOpenAiSmoke,
            ReportOutputPath = reportPath,
        };

        return true;
    }
}
