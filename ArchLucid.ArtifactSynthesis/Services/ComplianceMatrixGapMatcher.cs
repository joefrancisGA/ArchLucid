using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.ArtifactSynthesis.Services;

internal static class ComplianceMatrixGapMatcher
{
    public static IReadOnlyList<string> ResolveNotesForControl(
        CompliancePostureItem control,
        IReadOnlyList<CompliancePostureItem> controls,
        IReadOnlyList<string> gaps)
    {
        ArgumentNullException.ThrowIfNull(control);
        ArgumentNullException.ThrowIfNull(controls);
        ArgumentNullException.ThrowIfNull(gaps);

        List<string> notes = [];

        foreach (string gap in gaps)
        {
            string? ownerControlId = ResolveOwnerControlId(gap, controls);

            if (ownerControlId is not null &&
                string.Equals(ownerControlId, control.ControlId, StringComparison.OrdinalIgnoreCase))
            {
                notes.Add(gap);
            }
        }

        return notes;
    }

    private static string? ResolveOwnerControlId(string gap, IReadOnlyList<CompliancePostureItem> controls)
    {
        string? bestControlId = null;
        int bestControlNameLength = -1;

        foreach (CompliancePostureItem control in controls)
        {
            if (string.IsNullOrWhiteSpace(control.ControlName))
            {
                continue;
            }

            if (!gap.Contains(control.ControlName, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (control.ControlName.Length > bestControlNameLength)
            {
                bestControlNameLength = control.ControlName.Length;
                bestControlId = control.ControlId;
            }
        }

        return bestControlId;
    }
}
