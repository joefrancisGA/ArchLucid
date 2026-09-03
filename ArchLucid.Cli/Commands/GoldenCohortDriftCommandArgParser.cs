namespace ArchLucid.Cli.Commands;

/// <summary>Parsed flags for <c>archlucid golden-cohort drift</c>.</summary>
internal sealed class GoldenCohortDriftCommandOptions
{
    public bool StrictReal
    {
        get;
        init;
    }

    public bool StructuralOnly
    {
        get;
        init;
    }

    public string? CohortPath
    {
        get;
        init;
    }
}

/// <summary>CLI argument parsing for <see cref="GoldenCohortDriftCommand" />.</summary>
internal static class GoldenCohortDriftCommandArgParser
{
    public static GoldenCohortDriftCommandOptions? Parse(string[] args, out string? error)
    {
        if (args is null)
            throw new ArgumentNullException(nameof(args));

        error = null;
        bool strictReal = false;
        bool structuralOnly = false;
        string? cohortPath = null;

        for (int i = 0; i < args.Length; i++)
        {
            string token = args[i];

            if (string.Equals(token, "--strict-real", StringComparison.Ordinal))
            {
                strictReal = true;

                continue;
            }

            if (string.Equals(token, "--structural-only", StringComparison.Ordinal))
            {
                structuralOnly = true;

                continue;
            }

            if (string.Equals(token, "--cohort", StringComparison.Ordinal))
            {
                if (i + 1 >= args.Length)
                {
                    error = "Missing value for --cohort.";

                    return null;
                }

                cohortPath = args[++i].Trim();

                continue;
            }

            error = $"Unexpected argument: {token}";

            return null;
        }

        return new GoldenCohortDriftCommandOptions
        {
            StrictReal = strictReal,
            StructuralOnly = structuralOnly,
            CohortPath = cohortPath,
        };
    }
}
