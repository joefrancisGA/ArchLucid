using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static class ItsmPullForwardEvidenceParser
{
    private const string LedgerSchema = "archlucid.paid-pilot-evidence-ledger.v1";
    private const string EvidenceSchema = "archlucid.connector-pull-forward-evidence.v1";

    internal static ItsmPullForwardTriggerCounts AggregateTriggers(
        string repositoryRoot,
        ItsmPullForwardOptions options)
    {
        int connectorPrimary = 0;
        int sowContingent = 0;
        int manualHandoff = 0;

        string ledgerDirectory = ResolveLedgerDirectory(repositoryRoot, options.LedgerDirectory);

        if (Directory.Exists(ledgerDirectory))
        {
            foreach (string path in Directory.EnumerateFiles(ledgerDirectory, "*.json", SearchOption.AllDirectories))
            {
                if (!TryReadLedgerTriggers(path, out int ledgerConnectorPrimary))
                    continue;

                connectorPrimary += ledgerConnectorPrimary;
            }
        }

        string? evidencePath = ResolveEvidencePath(repositoryRoot, options.EvidencePath);

        if (evidencePath is not null && File.Exists(evidencePath))
        {
            ItsmPullForwardTriggerCounts evidenceTriggers = ParseEvidenceFile(evidencePath);
            connectorPrimary += evidenceTriggers.ConnectorPrimaryBlockerPilotCount;
            sowContingent += evidenceTriggers.SowContingentOnConnectorCount;
            manualHandoff += evidenceTriggers.ManualHandoffDominatesSecondReviewCount;
        }

        return new ItsmPullForwardTriggerCounts
        {
            ConnectorPrimaryBlockerPilotCount = connectorPrimary,
            SowContingentOnConnectorCount = sowContingent,
            ManualHandoffDominatesSecondReviewCount = manualHandoff,
        };
    }

    internal static int CountLedgerFiles(string repositoryRoot, ItsmPullForwardOptions options)
    {
        string ledgerDirectory = ResolveLedgerDirectory(repositoryRoot, options.LedgerDirectory);

        if (!Directory.Exists(ledgerDirectory))
            return 0;

        return Directory.EnumerateFiles(ledgerDirectory, "*.json", SearchOption.AllDirectories).Count();
    }

    internal static string ResolveLedgerDirectory(string repositoryRoot, string? ledgerDirectory)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);

        if (!string.IsNullOrWhiteSpace(ledgerDirectory))
            return Path.GetFullPath(ledgerDirectory);

        return Path.Combine(repositoryRoot, "artifacts", "validation", "paid-pilot-ledgers");
    }

    private static string? ResolveEvidencePath(string repositoryRoot, string? evidencePath)
    {
        if (!string.IsNullOrWhiteSpace(evidencePath))
            return Path.GetFullPath(evidencePath);

        string defaultPath = Path.Combine(
            repositoryRoot,
            "artifacts",
            "itsm",
            "connector-pull-forward-evidence.json");

        return defaultPath;
    }

    private static bool TryReadLedgerTriggers(string path, out int connectorPrimaryBlockerCount)
    {
        connectorPrimaryBlockerCount = 0;

        try
        {
            using JsonDocument document = JsonDocument.Parse(File.ReadAllText(path));

            if (!document.RootElement.TryGetProperty("schema", out JsonElement schemaElement))
                return false;

            if (!string.Equals(schemaElement.GetString(), LedgerSchema, StringComparison.Ordinal))
                return false;

            if (document.RootElement.TryGetProperty("paidPilot", out JsonElement paidPilotElement)
                && paidPilotElement.ValueKind == JsonValueKind.False)
            {
                return true;
            }

            if (!document.RootElement.TryGetProperty("blockers", out JsonElement blockersElement)
                || blockersElement.ValueKind != JsonValueKind.Array)
            {
                return true;
            }

            foreach (JsonElement blocker in blockersElement.EnumerateArray())
            {
                if (!blocker.TryGetProperty("category", out JsonElement categoryElement))
                    continue;

                string? category = categoryElement.GetString();

                if (string.Equals(category, "connector-gap", StringComparison.OrdinalIgnoreCase))
                    connectorPrimaryBlockerCount++;
            }

            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static ItsmPullForwardTriggerCounts ParseEvidenceFile(string path)
    {
        using JsonDocument document = JsonDocument.Parse(File.ReadAllText(path));

        if (document.RootElement.TryGetProperty("schema", out JsonElement schemaElement)
            && !string.Equals(schemaElement.GetString(), EvidenceSchema, StringComparison.Ordinal))
        {
            throw new InvalidOperationException($"Unsupported evidence schema in {path}.");
        }

        if (!document.RootElement.TryGetProperty("signals", out JsonElement signalsElement)
            || signalsElement.ValueKind != JsonValueKind.Object)
        {
            return new ItsmPullForwardTriggerCounts
            {
                ConnectorPrimaryBlockerPilotCount = 0,
                SowContingentOnConnectorCount = 0,
                ManualHandoffDominatesSecondReviewCount = 0,
            };
        }

        return new ItsmPullForwardTriggerCounts
        {
            ConnectorPrimaryBlockerPilotCount = ReadInt(signalsElement, "connectorPrimaryBlockerPilotCount"),
            SowContingentOnConnectorCount = ReadInt(signalsElement, "sowContingentOnConnectorCount"),
            ManualHandoffDominatesSecondReviewCount = ReadInt(signalsElement, "manualHandoffDominatesSecondReviewCount"),
        };
    }

    private static int ReadInt(JsonElement parent, string propertyName)
    {
        if (!parent.TryGetProperty(propertyName, out JsonElement valueElement))
            return 0;

        if (valueElement.ValueKind == JsonValueKind.Number && valueElement.TryGetInt32(out int parsed))
            return parsed;

        return 0;
    }
}
