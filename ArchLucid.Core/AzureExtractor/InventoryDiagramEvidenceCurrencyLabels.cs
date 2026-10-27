namespace ArchLucid.Core.AzureExtractor;

/// <summary>Formats NR-01 relationship edge labels with evidence currency.</summary>
public static class InventoryDiagramEvidenceCurrencyLabels
{
    public static string Format(InventoryDiagramEvidenceCurrency? currency, string relationshipLabel)
    {
        string trimmedLabel = relationshipLabel?.Trim() ?? string.Empty;
        string currencyLabel = currency switch
        {
            null => "Evidence currency was not stored",
            InventoryDiagramEvidenceCurrency.Current => "Current",
            InventoryDiagramEvidenceCurrency.Configured => "Configured",
            InventoryDiagramEvidenceCurrency.Observed => "Observed",
            InventoryDiagramEvidenceCurrency.Derived => "Derived",
            _ => "Evidence currency was not stored",
        };

        if (trimmedLabel.Length == 0)
        {
            return currencyLabel;
        }

        return $"{currencyLabel} · {trimmedLabel}";
    }

    public static InventoryDiagramEvidenceCurrency? ResolveFromSourceEvidenceReference(string? sourceEvidenceReference)
    {
        if (string.IsNullOrWhiteSpace(sourceEvidenceReference))
        {
            return null;
        }

        if (ContainsEvidenceReferenceToken(sourceEvidenceReference, "iac")
            || ContainsEvidenceReferenceToken(sourceEvidenceReference, "terraform")
            || ContainsEvidenceReferenceToken(sourceEvidenceReference, "bicep")
            || ContainsEvidenceReferenceToken(sourceEvidenceReference, "arm-template"))
        {
            return InventoryDiagramEvidenceCurrency.Configured;
        }

        if (ContainsEvidenceReferenceToken(sourceEvidenceReference, "activity-log")
            || ContainsEvidenceReferenceToken(sourceEvidenceReference, "diagnostic-log")
            || ContainsEvidenceReferenceToken(sourceEvidenceReference, "telemetry")
            || ContainsEvidenceReferenceToken(sourceEvidenceReference, "observed"))
        {
            return InventoryDiagramEvidenceCurrency.Observed;
        }

        return null;
    }

    private static bool ContainsEvidenceReferenceToken(string sourceEvidenceReference, string token)
    {
        if (token.Length == 0)
        {
            return false;
        }

        int start = 0;

        while (start <= sourceEvidenceReference.Length - token.Length)
        {
            int index = sourceEvidenceReference.IndexOf(token, start, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
            {
                return false;
            }

            bool leftBoundary = index == 0 || !char.IsLetterOrDigit(sourceEvidenceReference[index - 1]);
            int afterToken = index + token.Length;
            bool rightBoundary = afterToken >= sourceEvidenceReference.Length
                || !char.IsLetterOrDigit(sourceEvidenceReference[afterToken]);

            if (leftBoundary && rightBoundary)
            {
                return true;
            }

            start = index + 1;
        }

        return false;
    }
}
