using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Decisioning.Manifest.Sections;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.ArtifactSynthesis.Generators;

public class ComplianceMatrixArtifactGenerator : IArtifactGenerator
{
    public string ArtifactType => Models.ArtifactType.ComplianceMatrix;

    public Task<SynthesizedArtifact> GenerateAsync(
        ManifestDocument manifest,
        CancellationToken ct)
    {
        _ = ct;
        ComplianceMatrixArtifactModel matrix = new();

        foreach (CompliancePostureItem control in manifest.Compliance.Controls)
        {
            List<string> notes = manifest.Compliance.Gaps
                .Where(x => x.Contains(control.ControlName, StringComparison.OrdinalIgnoreCase))
                .ToList();

            matrix.Rows.Add(new ComplianceMatrixRow
            {
                ControlId = control.ControlId,
                ControlName = control.ControlName,
                AppliesToCategory = control.AppliesToCategory,
                Status = control.Status,
                Notes = notes.Count == 0 ? string.Empty : string.Join(" | ", notes)
            });
        }

        string content = JsonSerializer.Serialize(matrix, SynthesisJsonOptions.WriteIndented);

        return Task.FromResult(new SynthesizedArtifact
        {
            ArtifactId = Guid.NewGuid(),
            RunId = manifest.RunId,
            ManifestId = manifest.ManifestId,
            CreatedUtc = DateTime.UtcNow,
            ArtifactType = Models.ArtifactType.ComplianceMatrix,
            Name = "compliance-matrix.json",
            Format = "json",
            Content = content,
            ContentHash = ArtifactHashing.ComputeHash(content)
        });
    }
}
