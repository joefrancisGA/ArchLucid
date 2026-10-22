using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal sealed class DecisionOwnerScoreboardRules
{
    public int SchemaVersion { get; init; }

    public List<string> OwnerNotApplicableValues { get; init; } = [];

    public List<string> ResolvedOwnerOutcomes { get; init; } = [];

    public List<string> PendingOwnerOutcomes { get; init; } = [];

    public List<string> ValidOwnerOutcomes { get; init; } = [];
}

internal sealed class DecisionOwnerLedgerRecord
{
    public string SourcePath { get; init; } = string.Empty;

    public string? RunId { get; init; }

    public bool NoDecisionChangesConfirmed { get; init; }

    public IReadOnlyList<DecisionOwnerLedgerDecision> Decisions { get; init; } = [];

    public IReadOnlyList<DecisionOwnerLedgerChange> Changes { get; init; } = [];
}

internal sealed class DecisionOwnerLedgerDecision
{
    public string DecisionId { get; init; } = string.Empty;

    public string Title { get; init; } = string.Empty;

    public string? DecisionOwner { get; init; }

    public string? OwnerOutcome { get; init; }

    public DateTime? OutcomeRecordedUtc { get; init; }

    public string? ItsmTicketRef { get; init; }

    public DateTime? RemediationDueUtc { get; init; }
}

internal sealed class DecisionOwnerLedgerChange
{
    public string DecisionId { get; init; } = string.Empty;

    public bool ChangedBecauseOfArchLucidFinding { get; init; }

    public string? FindingId { get; init; }

    public string? EvidenceChainId { get; init; }
}

internal static class DecisionOwnerScoreboardRulesLoader
{
    private const string DefaultRulesFileName = "decision_owner_scoreboard_rules.v1.json";

    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static DecisionOwnerScoreboardRules Load(string? rulesFilePath)
    {
        string path = rulesFilePath ?? ResolveDefaultRulesPath();
        string json = File.ReadAllText(path);
        DecisionOwnerScoreboardRules? rules = JsonSerializer.Deserialize<DecisionOwnerScoreboardRules>(json, JsonRead)
            ?? throw new InvalidOperationException($"Decision-owner scoreboard rules are missing or empty: {path}");

        return rules;
    }

    private static string ResolveDefaultRulesPath()
    {
        string baseDirectory = AppContext.BaseDirectory;
        string bundled = Path.Combine(baseDirectory, "Data", DefaultRulesFileName);

        if (File.Exists(bundled))
            return bundled;

        string repoRelative = Path.GetFullPath(
            Path.Combine(baseDirectory, "..", "..", "..", "..", "ArchLucid.Cli", "Data", DefaultRulesFileName));

        if (File.Exists(repoRelative))
            return repoRelative;

        throw new FileNotFoundException(
            $"Decision-owner scoreboard rules not found (expected Data/{DefaultRulesFileName} next to the CLI assembly).",
            bundled);
    }
}
