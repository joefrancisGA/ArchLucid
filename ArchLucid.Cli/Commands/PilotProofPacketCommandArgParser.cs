namespace ArchLucid.Cli.Commands;

/// <summary>Parsed flags for <c>archlucid pilot proof-packet</c>.</summary>
internal sealed class PilotProofPacketCommandOptions
{
    public string RunId
    {
        get;
        init;
    } = string.Empty;

    public string? OutputDirectory
    {
        get;
        init;
    }

    public bool SkipClaimLint
    {
        get;
        init;
    }
}

/// <summary>Argument parsing for <see cref="PilotProofPacketCommand" />.</summary>
internal static class PilotProofPacketCommandArgParser
{
    public static PilotProofPacketCommandOptions? Parse(string[] args, out string? error)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        error = null;
        string? runId = null;
        string? outputDirectory = null;
        bool skipClaimLint = false;

        for (int i = 0; i < args.Length; i++)
        {
            string token = args[i];

            if (string.Equals(token, "--skip-claim-lint", StringComparison.OrdinalIgnoreCase))
            {
                skipClaimLint = true;

                continue;
            }

            if (string.Equals(token, "--out", StringComparison.OrdinalIgnoreCase)
                || string.Equals(token, "-o", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    error = "Missing value for --out.";

                    return null;
                }

                outputDirectory = args[++i];

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

        if (string.IsNullOrWhiteSpace(runId))
        {
            error = "Usage: archlucid pilot proof-packet <runId> [--out <dir>]";

            return null;
        }

        return new PilotProofPacketCommandOptions
        {
            RunId = runId,
            OutputDirectory = outputDirectory,
            SkipClaimLint = skipClaimLint,
        };
    }
}
