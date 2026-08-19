using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Findings;

/// <summary>
/// Maps TB-382 insight-density fields between <see cref="Finding" /> and <c>dbo.FindingRecords</c> TINYINT columns.
/// </summary>
internal static class FindingInsightDensityColumnCodec
{
    internal static byte? ToTreatmentStorage(FindingTreatment? value)
    {
        if (value is null)
        {
            return null;
        }

        return (byte)value.Value;
    }

    internal static FindingTreatment? FromTreatmentStorage(byte? value)
    {
        if (value is null)
        {
            return null;
        }

        return (FindingTreatment)value.Value;
    }

    internal static byte? ToClassificationStorage(FindingClassification? value)
    {
        if (value is null)
        {
            return null;
        }

        return (byte)value.Value;
    }

    internal static FindingClassification? FromClassificationStorage(byte? value)
    {
        if (value is null)
        {
            return null;
        }

        return (FindingClassification)value.Value;
    }
}
