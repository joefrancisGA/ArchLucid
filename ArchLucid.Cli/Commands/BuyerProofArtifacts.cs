namespace ArchLucid.Cli.Commands;

internal sealed record BuyerProofArtifacts(
    string DeltasJson,
    bool DemoWarning,
    string FirstValueMarkdown,
    byte[]? FirstValuePdf);
