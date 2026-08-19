using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;

namespace ArchLucid.TestSupport.TechnologyConsistency;

public sealed class TechnologyConsistencyFindingEngineExpected
{
    public TechnologyConsistencyFindingEngineMode Mode
    {
        get;
        set;
    } = TechnologyConsistencyFindingEngineMode.WarnOnly;

    public List<string> FindingTitles
    {
        get;
        set;
    } = [];

    public int? MinimumCount
    {
        get;
        set;
    }

    public int? MaximumCount
    {
        get;
        set;
    }
}

public sealed class TechnologyConsistencyArtifactLintExpected
{
    public TechnologyConsistencyFindingEngineMode Mode
    {
        get;
        set;
    } = TechnologyConsistencyFindingEngineMode.WarnOnly;

    public List<string> RuleIds
    {
        get;
        set;
    } = [];
}

public static class TechnologyConsistencyCorpusLoader
{
    public static List<TechnologyLedgerEntry> LoadLedger(string scenarioDirectory, string ledgerFileName = "ledger.json")
    {
        string ledgerPath = Path.Combine(scenarioDirectory, ledgerFileName);

        if (!File.Exists(ledgerPath))
            throw new FileNotFoundException("Ledger fixture was not found.", ledgerPath);

        string json = File.ReadAllText(ledgerPath);
        List<TechnologyLedgerEntry>? entries =
            System.Text.Json.JsonSerializer.Deserialize<List<TechnologyLedgerEntry>>(
                json,
                TechnologyConsistencyCorpusManifest.CreateJsonOptions());

        if (entries is null || entries.Count == 0)
            throw new InvalidOperationException($"Ledger fixture is empty: {ledgerPath}");

        return entries;
    }

    public static TechnologyConsistencyFindingEngineExpected LoadFindingEngineExpected(
        string scenarioDirectory,
        string expectedFileName = "expected.json")
    {
        string expectedPath = Path.Combine(scenarioDirectory, expectedFileName);
        string json = File.ReadAllText(expectedPath);

        TechnologyConsistencyFindingEngineExpected? expected =
            System.Text.Json.JsonSerializer.Deserialize<TechnologyConsistencyFindingEngineExpected>(
                json,
                TechnologyConsistencyCorpusManifest.CreateJsonOptions());

        return expected ?? throw new InvalidOperationException($"Expected fixture is invalid: {expectedPath}");
    }

    public static TechnologyConsistencyArtifactLintExpected LoadArtifactLintExpected(string scenarioDirectory)
    {
        string expectedPath = Path.Combine(scenarioDirectory, "expected.json");
        string json = File.ReadAllText(expectedPath);

        TechnologyConsistencyArtifactLintExpected? expected =
            System.Text.Json.JsonSerializer.Deserialize<TechnologyConsistencyArtifactLintExpected>(
                json,
                TechnologyConsistencyCorpusManifest.CreateJsonOptions());

        return expected ?? throw new InvalidOperationException($"Expected fixture is invalid: {expectedPath}");
    }

    public static string LoadArtifactProse(string scenarioDirectory)
    {
        string artifactPath = Path.Combine(scenarioDirectory, "artifact.md");

        if (!File.Exists(artifactPath))
            throw new FileNotFoundException("Artifact prose fixture was not found.", artifactPath);

        return File.ReadAllText(artifactPath);
    }
}
