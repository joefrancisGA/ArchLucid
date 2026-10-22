namespace ArchLucid.Cli.Commands;

internal sealed class ProofPacketCommandOptions
{
    public required string RunId
    {
        get;
        init;
    }

    public required string OutputZipPath
    {
        get;
        init;
    }

    public bool SkipClaimLint
    {
        get;
        init;
    }

    public static ProofPacketCommandOptions? TryParse(string[] args, out string? error)
    {
        error = null;
        string? runId = null;
        string? outputZip = null;
        bool skipClaimLint = false;

        for (int i = 0; i < args.Length; i++)
        {
            string token = args[i];

            if (string.Equals(token, "--skip-claim-lint", StringComparison.OrdinalIgnoreCase))
            {
                skipClaimLint = true;

                continue;
            }

            if (string.Equals(token, "--runId", StringComparison.OrdinalIgnoreCase)
                || string.Equals(token, "--run-id", StringComparison.OrdinalIgnoreCase))
            {
                if (i + 1 >= args.Length)
                {
                    error = "Missing value for --runId.";

                    return null;
                }

                runId = args[++i];

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

                outputZip = args[++i];

                continue;
            }

            if (token.StartsWith('-'))
            {
                error = $"Unexpected flag: {token}";

                return null;
            }

            error = $"Unexpected positional argument: {token}";

            return null;
        }

        if (string.IsNullOrWhiteSpace(runId) || string.IsNullOrWhiteSpace(outputZip))
        {
            error = "Both --runId and --out are required.";

            return null;
        }

        return new ProofPacketCommandOptions
        {
            RunId = runId.Trim(),
            OutputZipPath = outputZip.Trim(),
            SkipClaimLint = skipClaimLint,
        };
    }
}
