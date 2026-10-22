namespace ArchLucid.AzureLabGenerator;

public sealed class AzureLabCommandLineParser
{
    public const string Usage = """
        Usage:
          dotnet run --project ArchLucid.AzureLabGenerator -- --scenario <scenario> [--out <path>] [--force]

        Scenarios:
          landing-zone        500-resource landing zone
          landing-zone-later  later 500-resource snapshot for drift
          messy-estate        irregular 50-resource estate
          all                 write all three packs to an output directory

        Options:
          --out <path>        ZIP path, or output directory with --scenario all
          --force             overwrite existing ZIP files
          --help              show this help
        """;

    public AzureLabCommandLineOptions Parse(IReadOnlyList<string> args)
    {
        ArgumentNullException.ThrowIfNull(args);

        AzureLabScenarioSelection? selection = null;
        string? outputPath = null;
        bool force = false;

        for (int index = 0; index < args.Count; index++)
        {
            string argument = args[index];

            if (argument is "--help" or "-h")
            {
                throw new AzureLabCommandLineHelpException();
            }

            if (argument == "--force")
            {
                force = true;

                continue;
            }

            if (argument == "--scenario")
            {
                string value = ReadValue(args, ref index, argument);
                selection = ParseScenario(value);

                continue;
            }

            if (argument == "--out")
            {
                outputPath = ReadValue(args, ref index, argument);

                continue;
            }

            throw new AzureLabCommandLineException($"Unknown option '{argument}'. Use --help for usage.");
        }

        if (selection is null)
        {
            throw new AzureLabCommandLineException("--scenario is required. Use --help for usage.");
        }

        string resolvedOutputPath = Path.GetFullPath(
            outputPath ?? (selection == AzureLabScenarioSelection.All
                ? "azure-lab-output"
                : GetScenarioFileName(selection.Value)));

        return new AzureLabCommandLineOptions(selection.Value, resolvedOutputPath, force);
    }

    private static string ReadValue(IReadOnlyList<string> args, ref int index, string option)
    {
        int valueIndex = index + 1;

        if (valueIndex >= args.Count || string.IsNullOrWhiteSpace(args[valueIndex]))
        {
            throw new AzureLabCommandLineException($"{option} requires a value.");
        }

        index = valueIndex;

        return args[valueIndex];
    }

    private static AzureLabScenarioSelection ParseScenario(string value)
    {
        return value switch
        {
            "landing-zone" => AzureLabScenarioSelection.LandingZone,
            "landing-zone-later" => AzureLabScenarioSelection.LandingZoneLater,
            "messy-estate" => AzureLabScenarioSelection.MessyEstate,
            "all" => AzureLabScenarioSelection.All,
            _ => throw new AzureLabCommandLineException($"Unknown scenario '{value}'. Use --help to list valid scenarios."),
        };
    }

    private static string GetScenarioFileName(AzureLabScenarioSelection selection)
    {
        return selection switch
        {
            AzureLabScenarioSelection.LandingZone => "archlucid-lab-landing-zone.zip",
            AzureLabScenarioSelection.LandingZoneLater => "archlucid-lab-landing-zone-later.zip",
            AzureLabScenarioSelection.MessyEstate => "archlucid-lab-messy-estate.zip",
            AzureLabScenarioSelection.All => "azure-lab-output",
            _ => throw new ArgumentOutOfRangeException(nameof(selection), selection, "Unknown scenario selection."),
        };
    }
}
