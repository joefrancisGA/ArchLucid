using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal sealed class ShipGateExportMatrixContract
{
    public int SchemaVersion { get; init; }

    public List<ShipGateExportMatrixProbeDefinition> Probes { get; init; } = [];

    public List<int> AcceptableStatusCodes { get; init; } = [];
}

internal sealed class ShipGateExportMatrixProbeDefinition
{
    public string Id { get; init; } = string.Empty;

    public string Label { get; init; } = string.Empty;

    public string Format { get; init; } = string.Empty;

    public string Method { get; init; } = "GET";

    public string PathTemplate { get; init; } = string.Empty;

    public string? RequestBodyJson { get; init; }

    public List<string> ExpectedContentTypePrefixes { get; init; } = [];

    public int MinBodyBytes { get; init; }

    public bool RequireZipMagicBytes { get; init; }
}

internal static class ShipGateExportMatrixContractLoader
{
    private const string DefaultContractFileName = "ship_gate_export_matrix_contract.v1.json";

    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static ShipGateExportMatrixContract Load(string? contractFilePath = null)
    {
        string path = contractFilePath ?? ResolveDefaultContractPath();
        string json = File.ReadAllText(path);
        ShipGateExportMatrixContract? contract = JsonSerializer.Deserialize<ShipGateExportMatrixContract>(json, JsonRead)
            ?? throw new InvalidOperationException($"Ship-gate export matrix contract is missing or empty: {path}");

        if (contract.Probes.Count == 0)
            throw new InvalidOperationException($"Ship-gate export matrix contract must define probes: {path}");

        if (contract.AcceptableStatusCodes.Count == 0)
            contract.AcceptableStatusCodes.Add((int)System.Net.HttpStatusCode.OK);

        return contract;
    }

    private static string ResolveDefaultContractPath()
    {
        string baseDirectory = AppContext.BaseDirectory;
        string bundled = Path.Combine(baseDirectory, "Data", DefaultContractFileName);

        if (File.Exists(bundled))
            return bundled;

        string repoRelative = Path.GetFullPath(
            Path.Combine(baseDirectory, "..", "..", "..", "..", "ArchLucid.Cli", "Data", DefaultContractFileName));

        if (File.Exists(repoRelative))
            return repoRelative;

        throw new FileNotFoundException(
            $"Ship-gate export matrix contract not found (expected Data/{DefaultContractFileName} next to the CLI assembly).",
            bundled);
    }
}
