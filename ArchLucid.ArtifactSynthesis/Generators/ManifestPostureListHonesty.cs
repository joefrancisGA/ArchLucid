using System.Text;

using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.ArtifactSynthesis.Generators;

internal static class ManifestPostureListHonesty
{
    internal const string RequirementsCoverageNotStored = "Requirements coverage was not stored.";

    internal const string CoveredRequirementsNotStored = "Covered requirements were not stored.";

    internal const string CoveredRequirementsStoredEmpty = "Covered requirements were stored as an empty list.";

    internal const string UncoveredRequirementsNotStored = "Uncovered requirements were not stored.";

    internal const string UncoveredRequirementsStoredEmpty = "Uncovered requirements were stored as an empty list.";

    internal const string TopologySectionNotStored = "Topology section was not stored.";

    internal const string TopologyPostureNotStored = "Topology posture was not stored.";

    internal const string TopologyPostureStoredEmpty = "Topology posture was stored as an empty list.";

    internal const string ComplianceSectionNotStored = "Compliance section was not stored.";

    internal const string CompliancePostureNotStored = "Compliance posture was not stored.";

    internal const string CompliancePostureStoredEmpty = "Compliance posture was stored as an empty list.";

    internal const string ComplianceControlsNotStored = "Compliance controls were not stored.";

    internal const string ComplianceControlsStoredEmpty = "Compliance controls were stored as an empty list.";

    internal static void AppendRequirementsCoverageSection(StringBuilder sb, RequirementsCoverageSection? requirements)
    {
        ArgumentNullException.ThrowIfNull(sb);

        if (requirements is null)
        {
            sb.AppendLine(RequirementsCoverageNotStored);
            return;
        }

        IReadOnlyList<RequirementCoverageItem>? covered = requirements.Covered;
        IReadOnlyList<RequirementCoverageItem>? uncovered = requirements.Uncovered;

        if (covered is null && uncovered is null)
        {
            sb.AppendLine(RequirementsCoverageNotStored);
            return;
        }

        int written = 0;

        if (covered is null)
        {
            sb.AppendLine(CoveredRequirementsNotStored);
        }
        else if (covered.Count == 0)
        {
            sb.AppendLine(CoveredRequirementsStoredEmpty);
        }
        else
        {
            foreach (RequirementCoverageItem item in covered)
            {
                sb.AppendLine(FormatRequirementLine("Covered", item));
                written++;
            }
        }

        if (uncovered is null)
        {
            sb.AppendLine(UncoveredRequirementsNotStored);
        }
        else if (uncovered.Count == 0)
        {
            sb.AppendLine(UncoveredRequirementsStoredEmpty);
        }
        else
        {
            foreach (RequirementCoverageItem item in uncovered)
            {
                sb.AppendLine(FormatRequirementLine("Uncovered", item));
                written++;
            }
        }

        if (written == 0 && covered is not null && uncovered is not null)
        {
            sb.AppendLine(ArchitectureManifestNarrativeHonestyCopy.RequirementsCoverageStoredEmpty);
        }
    }

    internal static void AppendReferenceRequirementsSection(StringBuilder sb, RequirementsCoverageSection? requirements)
    {
        ArgumentNullException.ThrowIfNull(sb);

        if (requirements is null)
        {
            sb.AppendLine($"- {RequirementsCoverageNotStored}");
            return;
        }

        IReadOnlyList<RequirementCoverageItem>? covered = requirements.Covered;
        IReadOnlyList<RequirementCoverageItem>? uncovered = requirements.Uncovered;

        if (covered is null && uncovered is null)
        {
            sb.AppendLine($"- {RequirementsCoverageNotStored}");
            return;
        }

        if (covered is null)
            sb.AppendLine($"- {CoveredRequirementsNotStored}");
        else if (covered.Count == 0)
            sb.AppendLine($"- {CoveredRequirementsStoredEmpty}");
        else
            foreach (RequirementCoverageItem item in covered)
                sb.AppendLine(FormatReferenceRequirementLine("Covered", item));

        if (uncovered is null)
            sb.AppendLine($"- {UncoveredRequirementsNotStored}");
        else if (uncovered.Count == 0)
            sb.AppendLine($"- {UncoveredRequirementsStoredEmpty}");
        else
            foreach (RequirementCoverageItem item in uncovered)
                sb.AppendLine(FormatReferenceRequirementLine("Uncovered", item));
    }

    internal static int AppendTopologyStringList(
        StringBuilder sb,
        IReadOnlyList<string>? values,
        string notStoredCopy,
        string emptyListCopy,
        string bulletLabel)
    {
        ArgumentNullException.ThrowIfNull(sb);

        if (values is null)
        {
            sb.AppendLine($"- {notStoredCopy}");
            return 0;
        }

        if (values.Count == 0)
        {
            sb.AppendLine($"- {emptyListCopy}");
            return 0;
        }

        int written = 0;

        foreach (string value in values)
        {
            sb.AppendLine(
                $"- {bulletLabel}: {ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(value, $"{bulletLabel} was not stored.", $"{bulletLabel} was stored empty.")}");
            written++;
        }

        return written;
    }

    internal static void AppendCompliancePostureSection(StringBuilder sb, ComplianceSection? compliance, bool referenceStyle)
    {
        ArgumentNullException.ThrowIfNull(sb);

        if (compliance is null)
        {
            sb.AppendLine(referenceStyle ? $"- {CompliancePostureNotStored}" : CompliancePostureNotStored);
            return;
        }

        IReadOnlyList<CompliancePostureItem>? controls = compliance.Controls;
        IReadOnlyList<string>? gaps = compliance.Gaps;

        if (controls is null && gaps is null)
        {
            sb.AppendLine(referenceStyle ? $"- {CompliancePostureNotStored}" : CompliancePostureNotStored);
            return;
        }

        int written = 0;

        if (controls is null)
        {
            sb.AppendLine(referenceStyle ? $"- {ComplianceControlsNotStored}" : ComplianceControlsNotStored);
        }
        else if (controls.Count == 0)
        {
            sb.AppendLine(
                referenceStyle
                    ? $"- {ComplianceControlsStoredEmpty}"
                    : ComplianceControlsStoredEmpty);
        }
        else
        {
            foreach (CompliancePostureItem control in controls)
            {
                if (referenceStyle)
                {
                    string controlId = Docx.DocxManifestFieldPresentation.FormatManifestTableCell(
                        control.ControlId,
                        "Control id");
                    string controlName =
                        Docx.DocxManifestFieldPresentation.FormatManifestTableCell(control.ControlName, "Control name");
                    string appliesTo = Docx.DocxManifestFieldPresentation.FormatManifestTableCell(
                        control.AppliesToCategory,
                        "Applies-to category");
                    string status = Docx.DocxManifestFieldPresentation.FormatManifestTableCell(
                        control.Status,
                        "Control status");
                    sb.AppendLine($"- {controlId} {controlName} [{appliesTo}]: {status}");
                }
                else
                {
                    string controlId = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                        control.ControlId,
                        ArchitectureManifestNarrativeHonestyCopy.ControlIdNotStored);
                    string controlName = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
                        control.ControlName,
                        ArchitectureManifestNarrativeHonestyCopy.ControlNameNotStored);
                    string appliesTo = ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(
                        control.AppliesToCategory,
                        "Applies-to category was not stored.",
                        "Applies-to category was stored empty.");
                    string status = ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(
                        control.Status,
                        ArchitectureManifestNarrativeHonestyCopy.StatusNotStored,
                        ArchitectureManifestNarrativeHonestyCopy.StatusStoredEmpty);
                    sb.AppendLine($"- {controlId} {controlName} [{appliesTo}]: {status}");
                }

                written++;
            }
        }

        if (gaps is null)
        {
            sb.AppendLine(
                referenceStyle
                    ? "- Compliance gaps were not stored."
                    : "Compliance gaps were not stored.");
        }
        else
        {
            foreach (string gap in gaps)
            {
                if (referenceStyle)
                    sb.AppendLine($"- Gap: {gap}");
                else
                    sb.AppendLine(
                        $"- Compliance Gap: {ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(gap, "Compliance gap was not stored.", "Compliance gap was stored empty.")}");
                written++;
            }

            if (gaps.Count == 0 && written == 0 && controls is not null && controls.Count == 0)
            {
                sb.AppendLine(
                    referenceStyle
                        ? $"- {CompliancePostureStoredEmpty}"
                        : CompliancePostureStoredEmpty);
            }
        }
    }

    private static string FormatRequirementLine(string prefix, RequirementCoverageItem item)
    {
        string requirementName = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
            item.RequirementName,
            ArchitectureManifestNarrativeHonestyCopy.RequirementNameNotStored);
        string coverageStatus = ArchitectureManifestNarrativeHonestyCopy.FormatOptionalField(
            item.CoverageStatus,
            ArchitectureManifestNarrativeHonestyCopy.CoverageStatusNotStored);
        string line =
            $"- {prefix}: {requirementName} ({coverageStatus}; mandatory: {ArchitectureManifestNarrativeHonestyCopy.FormatMandatoryFlag(item)})";

        if (string.IsNullOrWhiteSpace(item.RequirementText))
            return line;

        return $"{line} — {item.RequirementText}";
    }

    private static string FormatReferenceRequirementLine(string prefix, RequirementCoverageItem item)
    {
        string requirementName =
            Docx.DocxManifestFieldPresentation.FormatManifestTableCell(item.RequirementName, "Requirement name");
        string coverageStatus =
            Docx.DocxManifestFieldPresentation.FormatManifestTableCell(item.CoverageStatus, "Coverage status");
        string line =
            $"- {prefix}: {requirementName} ({coverageStatus}; mandatory: {ArchitectureManifestNarrativeHonestyCopy.FormatMandatoryFlag(item)})";

        string requirementText = Docx.DocxManifestFieldPresentation.FormatManifestTableCell(
            item.RequirementText,
            "Requirement text");

        return $"{line} — {requirementText}";
    }
}
