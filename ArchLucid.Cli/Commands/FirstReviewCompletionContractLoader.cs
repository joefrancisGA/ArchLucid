using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal sealed class FirstReviewCompletionContract
{
    public int SchemaVersion { get; init; }

    public List<FirstReviewCompletionRunDetailSignal> RunDetailSignals { get; init; } = [];

    public List<FirstReviewCompletionLiveProbe> LiveProbes { get; init; } = [];

    public List<int> AcceptableStatusCodes { get; init; } = [];
}

internal sealed class FirstReviewCompletionRunDetailSignal
{
    public string Id { get; init; } = string.Empty;

    public string Label { get; init; } = string.Empty;

    public List<string> RequiredStatusValues { get; init; } = [];

    public bool RequireManifestVersion { get; init; }

    public bool RequireRequestId { get; init; }

    public bool RequireAnyExecutionSignal { get; init; }
}

internal sealed class FirstReviewCompletionLiveProbe
{
    public string Id { get; init; } = string.Empty;

    public string Label { get; init; } = string.Empty;

    public string Method { get; init; } = "GET";

    public string PathTemplate { get; init; } = string.Empty;

    public int MinArrayLength { get; init; }

    public FirstReviewCompletionJsonArrayPropertyRule? MinJsonArrayPropertyLength { get; init; }
}

internal sealed class FirstReviewCompletionJsonArrayPropertyRule
{
    public string Property { get; init; } = string.Empty;

    public int Min { get; init; }
}

internal static class FirstReviewCompletionContractLoader
{
    private const string DefaultContractFileName = "first_review_completion_contract.v1.json";

    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static FirstReviewCompletionContract Load(string? contractFilePath = null)
    {
        string path = contractFilePath ?? ResolveDefaultContractPath();
        string json = File.ReadAllText(path);
        FirstReviewCompletionContract? contract = JsonSerializer.Deserialize<FirstReviewCompletionContract>(json, JsonRead)
            ?? throw new InvalidOperationException($"First-review completion contract is missing or empty: {path}");

        if (contract.RunDetailSignals.Count == 0 && contract.LiveProbes.Count == 0)
            throw new InvalidOperationException($"First-review completion contract must define signals or probes: {path}");

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
            $"First-review completion contract not found (expected Data/{DefaultContractFileName} next to the CLI assembly).",
            bundled);
    }
}
