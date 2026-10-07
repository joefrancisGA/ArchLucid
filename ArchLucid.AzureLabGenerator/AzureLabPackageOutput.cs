namespace ArchLucid.AzureLabGenerator;

public sealed record AzureLabPackageOutput(
    string Path,
    int ResourceCount,
    long ByteCount,
    string Sha256);
