using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal sealed class FirstReviewUiRouteSmokeContract
{
    public int SchemaVersion { get; init; }

    public List<FirstReviewUiRouteSmokeRoute> Routes { get; init; } = [];

    public List<int> AcceptableStatusCodes { get; init; } = [];

    public List<string> ErrorBoundaryMarkers { get; init; } = [];
}

internal sealed class FirstReviewUiRouteSmokeRoute
{
    public string Id { get; init; } = string.Empty;

    public string Label { get; init; } = string.Empty;

    public string PathTemplate { get; init; } = string.Empty;
}

internal static class FirstReviewUiRouteSmokeContractLoader
{
    private const string DefaultContractFileName = "first_review_ui_route_smoke_contract.v1.json";

    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static FirstReviewUiRouteSmokeContract Load(string? contractFilePath = null)
    {
        string path = contractFilePath ?? ResolveDefaultContractPath();
        string json = File.ReadAllText(path);
        FirstReviewUiRouteSmokeContract? contract = JsonSerializer.Deserialize<FirstReviewUiRouteSmokeContract>(json, JsonRead)
            ?? throw new InvalidOperationException($"First-review UI route smoke contract is missing or empty: {path}");

        if (contract.Routes.Count == 0)
            throw new InvalidOperationException($"First-review UI route smoke contract must define routes: {path}");

        if (contract.AcceptableStatusCodes.Count == 0)
        {
            contract.AcceptableStatusCodes.Add(200);
            contract.AcceptableStatusCodes.Add(301);
            contract.AcceptableStatusCodes.Add(302);
            contract.AcceptableStatusCodes.Add(307);
            contract.AcceptableStatusCodes.Add(308);
        }

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
            $"First-review UI route smoke contract not found (expected Data/{DefaultContractFileName} next to the CLI assembly).",
            bundled);
    }
}
