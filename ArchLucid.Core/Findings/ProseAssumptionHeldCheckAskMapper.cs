using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>Maps NotVerifiable prose assumptions to held-check upload asks (DX-66).</summary>
public static class ProseAssumptionHeldCheckAskMapper
{
    public static IReadOnlyList<ProseAssumptionHeldCheckAsk> MapAsks(
        IReadOnlyList<ProseAssumptionRegisterEntry> registerEntries,
        IReadOnlyList<HeldCheckLedgerRollupEntry> heldCheckLedgerEntries,
        int maxAsks)
    {
        ArgumentNullException.ThrowIfNull(registerEntries);
        ArgumentNullException.ThrowIfNull(heldCheckLedgerEntries);

        if (maxAsks <= 0 || registerEntries.Count == 0)
        {
            return [];
        }

        HashSet<HeldCheckInputCode> ledgerCodes = heldCheckLedgerEntries
            .Select(static entry => entry.InputCode)
            .ToHashSet();

        List<ProseAssumptionHeldCheckAsk> asks = [];
        HashSet<HeldCheckInputCode> seenCodes = new();

        foreach (ProseAssumptionRegisterEntry entry in registerEntries)
        {
            if (asks.Count >= maxAsks)
            {
                break;
            }

            if (entry.Disposition != ProseAssumptionDisposition.NotVerifiable)
            {
                continue;
            }

            HeldCheckInputCode? inputCode = TryMapInputCode(entry.LogicalPropertyName, ledgerCodes);

            if (inputCode is null || !seenCodes.Add(inputCode.Value))
            {
                continue;
            }

            asks.Add(new ProseAssumptionHeldCheckAsk
            {
                InputCode = inputCode.Value,
                Statement = TruncateStatement(entry.Statement),
                EvidenceRef = string.IsNullOrWhiteSpace(entry.EvidenceRef)
                    ? BuildEvidenceRef(entry.DocumentPath, entry.LineNumber)
                    : entry.EvidenceRef.Trim(),
            });
        }

        return asks;
    }

    private static HeldCheckInputCode? TryMapInputCode(
        string? logicalPropertyName,
        IReadOnlySet<HeldCheckInputCode> ledgerCodes)
    {
        if (string.IsNullOrWhiteSpace(logicalPropertyName))
        {
            return null;
        }

        if (IsInventoryBackedProperty(logicalPropertyName))
        {
            return ResolveInventoryInputCode(ledgerCodes);
        }

        return logicalPropertyName switch
        {
            DeclarationSecurityPropertyLogicalNames.K8sPrivileged
                or DeclarationSecurityPropertyLogicalNames.K8sHostNetwork =>
                ledgerCodes.Contains(HeldCheckInputCode.NetworkPolicyRules)
                    ? HeldCheckInputCode.NetworkPolicyRules
                    : null,
            _ => null,
        };
    }

    private static bool IsInventoryBackedProperty(string logicalPropertyName) =>
        logicalPropertyName.Equals(DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess, StringComparison.Ordinal)
        || logicalPropertyName.Equals(DeclarationSecurityPropertyLogicalNames.AllowBlobPublicAccess, StringComparison.Ordinal)
        || logicalPropertyName.Equals(DeclarationSecurityPropertyLogicalNames.HttpsOnly, StringComparison.Ordinal)
        || logicalPropertyName.Equals(DeclarationSecurityPropertyLogicalNames.StorageEncrypted, StringComparison.Ordinal)
        || logicalPropertyName.Equals(DeclarationSecurityPropertyLogicalNames.NetworkAclDefaultAction, StringComparison.Ordinal)
        || logicalPropertyName.Equals(DeclarationSecurityPropertyLogicalNames.IngressBlob, StringComparison.Ordinal)
        || logicalPropertyName.Equals(DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion, StringComparison.Ordinal)
        || logicalPropertyName.Equals(DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled, StringComparison.Ordinal);

    private static HeldCheckInputCode? ResolveInventoryInputCode(IReadOnlySet<HeldCheckInputCode> ledgerCodes)
    {
        if (ledgerCodes.Contains(HeldCheckInputCode.AzureInventoryZip))
        {
            return HeldCheckInputCode.AzureInventoryZip;
        }

        if (ledgerCodes.Contains(HeldCheckInputCode.AwsInventoryZip))
        {
            return HeldCheckInputCode.AwsInventoryZip;
        }

        if (ledgerCodes.Contains(HeldCheckInputCode.GcpInventoryZip))
        {
            return HeldCheckInputCode.GcpInventoryZip;
        }

        return null;
    }

    private static string BuildEvidenceRef(string documentPath, int lineNumber) =>
        $"doc:{documentPath}#L{lineNumber}";

    private static string TruncateStatement(string statement)
    {
        if (string.IsNullOrWhiteSpace(statement))
        {
            return string.Empty;
        }

        string trimmed = statement.Trim();

        return trimmed.Length <= 120 ? trimmed : trimmed[..117] + "...";
    }
}
