using System.Text.Json;

namespace ArchLucid.Application.Governance.PolicyPackCompoundingEvidenceLedger;

/// <summary>
///     Stable JSON serialization for TB-885 compounding-evidence ledgers.
/// </summary>
public static class PolicyPackCompoundingEvidenceLedgerJson
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
    };

    public static string Serialize(PolicyPackCompoundingEvidenceLedger ledger) =>
        JsonSerializer.Serialize(ledger, SerializerOptions);

    public static PolicyPackCompoundingEvidenceLedger Deserialize(string json) =>
        JsonSerializer.Deserialize<PolicyPackCompoundingEvidenceLedger>(json, SerializerOptions)
        ?? throw new JsonException("Policy pack compounding evidence ledger JSON was empty or invalid.");
}
