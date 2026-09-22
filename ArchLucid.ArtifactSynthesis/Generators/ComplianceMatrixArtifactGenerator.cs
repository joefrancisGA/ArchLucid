using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Core.Manifest.Sections;
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
            IReadOnlyList<string> notes = ComplianceMatrixGapMatcher.ResolveNotesForControl(
                control,
                manifest.Compliance.Controls,
                manifest.Compliance.Gaps);

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
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ArtifactType = Models.ArtifactType.ComplianceMatrix,
            Name = "compliance-matrix.json",
            Format = "json",
            Content = content,
            ContentHash = ArtifactHashing.ComputeHash(content)
        });
    }
}
