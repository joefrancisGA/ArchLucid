namespace ArchLucid.Cli.Commands;

/// <summary>Parsed flags for <c>archlucid buyer-proof-pack</c>.</summary>
internal sealed class BuyerProofPackCommandOptions
{
    public string RunId
    {
        get;
        init;
    } = string.Empty;

    public string OutZip
    {
        get;
        init;
    } = string.Empty;

    public string? RepoRootOverride
    {
        get;
        init;
    }
}

/// <summary>Argument parsing for <see cref="BuyerProofPackCommand" />.</summary>
internal static class BuyerProofPackCommandArgParser
{
    public static BuyerProofPackCommandOptions? Parse(string[] args, out string? error)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        error = null;
        string? runId = null;
        string? outZip = null;
        string? repoRootOverride = null;

        for (int i = 0; i < args.Length; i++)
        {
            string token = args[i];

            if (string.Equals(token, "--out", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    error = "Missing value for --out.";

                    return null;
                }

                outZip = args[++i];

                continue;
            }

            if (string.Equals(token, "--repo-root", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    error = "Missing value for --repo-root.";

                    return null;
                }

                repoRootOverride = args[++i];

                continue;
            }

            if (token.StartsWith('-'))
            {
                error = $"Unexpected flag: {token}";

                return null;
            }

            if (runId is not null)
            {
                error = "Only one run id is supported.";

                return null;
            }

            runId = token;
        }

        if (string.IsNullOrWhiteSpace(runId) || string.IsNullOrWhiteSpace(outZip))
        {
            error =
                "Usage: archlucid buyer-proof-pack <runId> --out <path.zip> [--repo-root <dir>]";

            return null;
        }

        return new BuyerProofPackCommandOptions
        {
            RunId = runId,
            OutZip = outZip,
            RepoRootOverride = repoRootOverride,
        };
    }
}
