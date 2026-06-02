namespace ArchLucid.Cli.Commands;

/// <summary>Parsed arguments for <see cref="RequestCreateCommand" />.</summary>
internal sealed class RequestCreateCommandOptions
{
    public const string DefaultApiBaseUrl = TryCommandOptions.DefaultApiBaseUrl;

    public required string InputPath
    {
        get;
        init;
    }

    public string? RequestIdOverride
    {
        get;
        init;
    }

    /// <summary>When true, <see cref="ApiBaseUrl" /> came from <c>--api-base-url</c> and must override config.</summary>
    public bool ApiBaseUrlFromArgument
    {
        get;
        init;
    }

    public string ApiBaseUrl
    {
        get;
        init;
    } = DefaultApiBaseUrl;

    /// <summary>Parses arguments after the <c>request create</c> tokens.</summary>
    public static RequestCreateCommandOptions? Parse(string[] args, out string? error)
    {
        ArgumentNullException.ThrowIfNull(args);

        string? inputPath = null;
        string? requestIdOverride = null;
        string apiBaseUrl = DefaultApiBaseUrl;
        bool apiBaseUrlFromArgument = false;

        for (int i = 0; i < args.Length; i++)
        {
            string current = args[i];

            switch (current)
            {
                case "--from-file":
                    if (!TryReadNext(args, ref i, current, out string? fileValue, out error))
                        return null;

                    inputPath = fileValue;
                    break;

                case "--request-id":
                    if (!TryReadNext(args, ref i, current, out string? requestIdValue, out error))
                        return null;

                    requestIdOverride = requestIdValue;
                    break;

                case "--api-base-url":
                    if (!TryReadNext(args, ref i, current, out string? apiValue, out error))
                        return null;

                    apiBaseUrl = apiValue!.TrimEnd('/');
                    apiBaseUrlFromArgument = true;
                    break;

                default:
                    error = $"Unknown argument for 'request create': {current}.";

                    return null;
            }
        }

        if (string.IsNullOrWhiteSpace(inputPath))
        {
            error =
                "Usage: archlucid request create --from-file <path.json> [--request-id <id>] [--api-base-url <url>]";

            return null;
        }

        error = null;

        return new RequestCreateCommandOptions
        {
            InputPath = inputPath,
            RequestIdOverride = requestIdOverride,
            ApiBaseUrlFromArgument = apiBaseUrlFromArgument,
            ApiBaseUrl = apiBaseUrl
        };
    }

    private static bool TryReadNext(string[] args, ref int index, string flag, out string? value, out string? error)
    {
        if (index + 1 >= args.Length)
        {
            value = null;
            error = $"Missing value for {flag}.";

            return false;
        }

        index++;
        value = args[index];
        error = null;

        return true;
    }
}
