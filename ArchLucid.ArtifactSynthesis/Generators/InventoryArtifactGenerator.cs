using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.ArtifactSynthesis.Generators;

public class InventoryArtifactGenerator : IArtifactGenerator
{
    public string ArtifactType => Models.ArtifactType.Inventory;

    public Task<SynthesizedArtifact> GenerateAsync(
        ManifestDocument manifest,
        CancellationToken ct)
    {
        _ = ct;
        InventoryArtifactModel inventory = new();

        foreach (RequirementCoverageItem requirement in manifest.Requirements.Covered)

            inventory.Items.Add(new InventoryItem
            {
                Category = "Requirement",
                Name = DocxManifestFieldPresentation.FormatManifestTableCell(
                    requirement.RequirementName,
                    "Requirement name"),
                Status = DocxManifestFieldPresentation.FormatManifestTableCell(
                    requirement.CoverageStatus,
                    "Coverage status"),
                Notes = DocxManifestFieldPresentation.FormatManifestTableCell(
                    requirement.RequirementText,
                    "Requirement text"),
                IsMandatory = requirement.IsMandatory,
            });

        foreach (RequirementCoverageItem requirement in manifest.Requirements.Uncovered)

            inventory.Items.Add(new InventoryItem
            {
                Category = "Requirement",
                Name = DocxManifestFieldPresentation.FormatManifestTableCell(
                    requirement.RequirementName,
                    "Requirement name"),
                Status = DocxManifestFieldPresentation.FormatManifestTableCell(
                    requirement.CoverageStatus,
                    "Coverage status"),
                Notes = DocxManifestFieldPresentation.FormatManifestTableCell(
                    requirement.RequirementText,
                    "Requirement text"),
                IsMandatory = requirement.IsMandatory,
            });

        foreach (SecurityPostureItem control in manifest.Security.Controls)

            inventory.Items.Add(new InventoryItem
            {
                Category = "SecurityControl",
                ControlId = DocxManifestFieldPresentation.FormatManifestTableCell(control.ControlId, "Control id"),
                Name = DocxManifestFieldPresentation.FormatManifestTableCell(control.ControlName, "Control name"),
                Status = DocxManifestFieldPresentation.FormatManifestTableCell(control.Status, "Control status"),
                Notes = DocxManifestFieldPresentation.FormatManifestTableCell(control.Impact, "Impact"),
            });

        foreach (CompliancePostureItem control in manifest.Compliance.Controls)

            inventory.Items.Add(new InventoryItem
            {
                Category = "ComplianceControl",
                ControlId = DocxManifestFieldPresentation.FormatManifestTableCell(control.ControlId, "Control id"),
                Name = DocxManifestFieldPresentation.FormatManifestTableCell(control.ControlName, "Control name"),
                Status = DocxManifestFieldPresentation.FormatManifestTableCell(control.Status, "Control status"),
                Notes = DocxManifestFieldPresentation.FormatManifestTableCell(
                    control.AppliesToCategory,
                    "Applies-to category"),
            });

        foreach (ManifestIssue issue in manifest.UnresolvedIssues.Items)

            inventory.Items.Add(new InventoryItem
            {
                Category = "Issue",
                Name = DocxManifestFieldPresentation.FormatManifestTableCell(issue.Title, "Issue title"),
                Status = DocxManifestFieldPresentation.FormatManifestTableCell(issue.Severity, "Severity"),
                Notes = DocxManifestFieldPresentation.FormatManifestTableCell(issue.Description, "Issue description"),
                IssueType = DocxManifestFieldPresentation.FormatManifestTableCell(issue.IssueType, "Issue type"),
                SupportingFindingIds = issue.SupportingFindingIds.ToList(),
            });

        string content = JsonSerializer.Serialize(inventory, SynthesisJsonOptions.WriteIndented);

        return Task.FromResult(new SynthesizedArtifact
        {
            ArtifactId = Guid.NewGuid(),
            RunId = manifest.RunId,
            ManifestId = manifest.ManifestId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ArtifactType = Models.ArtifactType.Inventory,
            Name = "inventory.json",
            Format = "json",
            Content = content,
            ContentHash = ArtifactHashing.ComputeHash(content)
        });
    }
}
