namespace ArchLucid.AzureLabGenerator;

public sealed class AzureLabPackageGenerator
{
    private readonly AzureLabScenarioCatalog catalog;
    private readonly AzureLabPackageFileWriter fileWriter;

    public AzureLabPackageGenerator(AzureLabScenarioCatalog catalog, AzureLabPackageFileWriter fileWriter)
    {
        this.catalog = catalog ?? throw new ArgumentNullException(nameof(catalog));
        this.fileWriter = fileWriter ?? throw new ArgumentNullException(nameof(fileWriter));
    }

    public IReadOnlyList<AzureLabPackageOutput> Generate(AzureLabCommandLineOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        return options.Selection == AzureLabScenarioSelection.All
            ? GenerateAll(options)
            : [WriteScenario(ToScenarioId(options.Selection), options.OutputPath, options.Force)];
    }

    private IReadOnlyList<AzureLabPackageOutput> GenerateAll(AzureLabCommandLineOptions options)
    {
        List<AzureLabPackageOutput> outputs = [];

        foreach (AzureLabScenario scenario in catalog.Scenarios)
        {
            string outputPath = Path.Combine(options.OutputPath, scenario.ZipFileName);
            outputs.Add(WriteScenario(scenario.Id, outputPath, options.Force));
        }

        return outputs;
    }

    private AzureLabPackageOutput WriteScenario(AzureLabScenarioId scenarioId, string outputPath, bool force)
    {
        AzureLabScenario scenario = catalog.Get(scenarioId);

        return fileWriter.Write(scenario, outputPath, force);
    }

    private static AzureLabScenarioId ToScenarioId(AzureLabScenarioSelection selection)
    {
        return selection switch
        {
            AzureLabScenarioSelection.LandingZone => AzureLabScenarioId.LandingZone,
            AzureLabScenarioSelection.LandingZoneLater => AzureLabScenarioId.LandingZoneLater,
            AzureLabScenarioSelection.MessyEstate => AzureLabScenarioId.MessyEstate,
            _ => throw new ArgumentOutOfRangeException(nameof(selection), selection, "The selection does not identify one scenario."),
        };
    }
}
