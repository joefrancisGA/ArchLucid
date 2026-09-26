namespace ArchLucid.Core.AzureExtractor;

/// <summary>Formats NR-01 relationship edge labels with evidence currency.</summary>
public static class InventoryDiagramEvidenceCurrencyLabels
{
    public static string Format(InventoryDiagramEvidenceCurrency currency, string relationshipLabel)
    {
        string trimmedLabel = relationshipLabel?.Trim() ?? string.Empty;
        string currencyLabel = currency switch
        {
            InventoryDiagramEvidenceCurrency.Current => "Current",
            InventoryDiagramEvidenceCurrency.Configured => "Configured",
            InventoryDiagramEvidenceCurrency.Observed => "Observed",
            InventoryDiagramEvidenceCurrency.Derived => "Derived",
            _ => "Current",
        };

        if (trimmedLabel.Length == 0)
        {
            return currencyLabel;
        }

        return $"{currencyLabel} · {trimmedLabel}";
    }

    public static InventoryDiagramEvidenceCurrency ResolveFromSourceEvidenceReference(string? sourceEvidenceReference)
    {
        if (string.IsNullOrWhiteSpace(sourceEvidenceReference))
        {
            return InventoryDiagramEvidenceCurrency.Current;
        }

        if (sourceEvidenceReference.Contains("iac", StringComparison.OrdinalIgnoreCase)
            || sourceEvidenceReference.Contains("terraform", StringComparison.OrdinalIgnoreCase)
            || sourceEvidenceReference.Contains("bicep", StringComparison.OrdinalIgnoreCase)
            || sourceEvidenceReference.Contains("arm-template", StringComparison.OrdinalIgnoreCase))
        {
            return InventoryDiagramEvidenceCurrency.Configured;
        }

        if (sourceEvidenceReference.Contains("log", StringComparison.OrdinalIgnoreCase)
            || sourceEvidenceReference.Contains("telemetry", StringComparison.OrdinalIgnoreCase)
            || sourceEvidenceReference.Contains("observed", StringComparison.OrdinalIgnoreCase))
        {
            return InventoryDiagramEvidenceCurrency.Observed;
        }

        return InventoryDiagramEvidenceCurrency.Current;
    }
}
