namespace ArchLucid.AzureLabGenerator;

public sealed record AzureLabCommandLineOptions(
    AzureLabScenarioSelection Selection,
    string OutputPath,
    bool Force);
