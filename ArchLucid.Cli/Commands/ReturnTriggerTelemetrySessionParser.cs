using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal sealed class ReturnTriggerTelemetrySessionRecord
{
    public string SourcePath { get; init; } = string.Empty;

    public string Schema { get; init; } = string.Empty;

    public string? SessionId { get; init; }

    public string? ReuseIntent { get; init; }

    public string? ReturnTriggerCode { get; init; }

    public string? DismissalTriggerCode { get; init; }

    public bool DismissalObserved { get; init; }

    public bool NoDismissalObserved { get; init; }
}

internal static class ReturnTriggerTelemetryRulesLoader
{
    private const string DefaultRulesFileName = "principal_architect_return_trigger_rules.v1.json";

    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static ReturnTriggerTelemetryRules Load(string? rulesFilePath)
    {
        string path = rulesFilePath ?? ResolveDefaultRulesPath();
        string json = File.ReadAllText(path);
        ReturnTriggerTelemetryRules? rules = JsonSerializer.Deserialize<ReturnTriggerTelemetryRules>(json, JsonRead)
            ?? throw new InvalidOperationException($"Return-trigger telemetry rules are missing or empty: {path}");

        if (rules.PositiveReuseIntents.Count == 0)
            throw new InvalidOperationException($"Return-trigger telemetry rules must define positiveReuseIntents: {path}");

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
            $"Return-trigger telemetry rules not found (expected Data/{DefaultRulesFileName} next to the CLI assembly).",
            bundled);
    }
}

internal sealed class ReturnTriggerTelemetryRules
{
    public int SchemaVersion { get; init; }

    public int MinSessionsForMessaging { get; init; } = 3;

    public List<string> PositiveReuseIntents { get; init; } = [];

    public Dictionary<string, string> ReturnTriggerCodes { get; init; } =
        new(StringComparer.OrdinalIgnoreCase);

    public ReturnTriggerTelemetryGuardrails Guardrails { get; init; } = new();
}

internal sealed class ReturnTriggerTelemetryGuardrails
{
    public double MinPositiveReuseFraction { get; init; } = 0.33;

    public double MaxDismissalWithoutReturnFraction { get; init; } = 0.67;
}

internal static class ReturnTriggerTelemetrySessionParser
{
    internal static IReadOnlyList<ReturnTriggerTelemetrySessionRecord> LoadDirectory(string ledgerDirectory)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(ledgerDirectory);

        if (!Directory.Exists(ledgerDirectory))
            return [];

        List<ReturnTriggerTelemetrySessionRecord> records = new();

        foreach (string filePath in Directory.EnumerateFiles(ledgerDirectory, "*.json", SearchOption.AllDirectories))
        {
            string json = File.ReadAllText(filePath);
            using JsonDocument document = JsonDocument.Parse(json);
            JsonElement root = document.RootElement;

            if (!root.TryGetProperty("schema", out JsonElement schemaElement))
                continue;

            string schema = schemaElement.GetString() ?? string.Empty;
            ReturnTriggerTelemetrySessionRecord? record = schema switch
            {
                "archlucid.principal-architect-return-trigger.v1" => ParseReturnTrigger(root, filePath),
                "archlucid.principal-architect-dismissal-log.v1" => ParseDismissalLog(root, filePath),
                "archlucid.first-session-dismissal-trigger.v1" => ParseFirstSessionDismissal(root, filePath),
                "archlucid.principal-architect-session.v1" => ParsePrincipalSession(root, filePath),
                "archlucid.pilot-reuse-cohort-tracker.v1" => ParseReuseTracker(root, filePath),
                _ => null,
            };

            if (record is not null)
                records.Add(record);
        }

        return records
            .OrderBy(static record => record.SourcePath, StringComparer.Ordinal)
            .ToList();
    }

    private static ReturnTriggerTelemetrySessionRecord ParseReturnTrigger(JsonElement root, string filePath)
    {
        return new ReturnTriggerTelemetrySessionRecord
        {
            SourcePath = filePath,
            Schema = "archlucid.principal-architect-return-trigger.v1",
            SessionId = ReadString(root, "sessionId"),
            ReuseIntent = ReadString(root, "reuseIntent30Day"),
            ReturnTriggerCode = ReadString(root, "returnTriggerCode"),
            DismissalObserved = false,
            NoDismissalObserved = string.Equals(ReadString(root, "returnTriggerCode"), "R8", StringComparison.OrdinalIgnoreCase),
        };
    }

    private static ReturnTriggerTelemetrySessionRecord ParseDismissalLog(JsonElement root, string filePath)
    {
        string? dismissalCode = null;
        bool noDismissal = root.TryGetProperty("noDismissalObserved", out JsonElement noDismissalElement)
            && noDismissalElement.ValueKind == JsonValueKind.True;

        if (root.TryGetProperty("dismissalAssessment", out JsonElement assessment))
            dismissalCode = ReadString(assessment, "primaryTriggerCode");

        return new ReturnTriggerTelemetrySessionRecord
        {
            SourcePath = filePath,
            Schema = "archlucid.principal-architect-dismissal-log.v1",
            SessionId = ReadString(root, "sessionId"),
            DismissalTriggerCode = dismissalCode,
            DismissalObserved = !noDismissal && !string.Equals(dismissalCode, "D8", StringComparison.OrdinalIgnoreCase),
            NoDismissalObserved = noDismissal || string.Equals(dismissalCode, "D8", StringComparison.OrdinalIgnoreCase),
        };
    }

    private static ReturnTriggerTelemetrySessionRecord ParseFirstSessionDismissal(JsonElement root, string filePath)
    {
        string? dismissalCode = ReadString(root, "primaryDismissalCode");
        bool nearDismissal = root.TryGetProperty("nearDismissal", out JsonElement nearDismissalElement)
            && nearDismissalElement.ValueKind == JsonValueKind.True;

        return new ReturnTriggerTelemetrySessionRecord
        {
            SourcePath = filePath,
            Schema = "archlucid.first-session-dismissal-trigger.v1",
            SessionId = ReadString(root, "cohortLabel"),
            DismissalTriggerCode = dismissalCode,
            DismissalObserved = nearDismissal || (!string.IsNullOrWhiteSpace(dismissalCode)
                && !string.Equals(dismissalCode, "D8", StringComparison.OrdinalIgnoreCase)),
            NoDismissalObserved = string.Equals(dismissalCode, "D8", StringComparison.OrdinalIgnoreCase),
        };
    }

    private static ReturnTriggerTelemetrySessionRecord ParsePrincipalSession(JsonElement root, string filePath)
    {
        return new ReturnTriggerTelemetrySessionRecord
        {
            SourcePath = filePath,
            Schema = "archlucid.principal-architect-session.v1",
            SessionId = ReadString(root, "sessionId"),
            ReuseIntent = ReadString(root, "reuseIntent"),
        };
    }

    private static ReturnTriggerTelemetrySessionRecord ParseReuseTracker(JsonElement root, string filePath)
    {
        string? reuseIntent = null;

        if (root.TryGetProperty("followUp", out JsonElement followUp)
            && followUp.TryGetProperty("day30", out JsonElement day30))
        {
            string usageState = ReadString(day30, "usageState") ?? string.Empty;

            reuseIntent = usageState switch
            {
                "returned-voluntarily" or "continuing-voluntarily" => "yes",
                "inactive-no-return" or "dropped" => "no",
                _ => "maybe",
            };
        }

        return new ReturnTriggerTelemetrySessionRecord
        {
            SourcePath = filePath,
            Schema = "archlucid.pilot-reuse-cohort-tracker.v1",
            SessionId = ReadString(root, "sessionId"),
            ReuseIntent = reuseIntent,
        };
    }

    private static string? ReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
            return null;

        return value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    }
}
