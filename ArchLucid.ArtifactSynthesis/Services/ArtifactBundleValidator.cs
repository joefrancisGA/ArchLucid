using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Validation;

namespace ArchLucid.ArtifactSynthesis.Services;

public class ArtifactBundleValidator : IArtifactBundleValidator
{
    public void Validate(ArtifactBundle bundle)
    {
        if (bundle.BundleId == Guid.Empty)
            throw new InvalidOperationException("BundleId is required.");

        if (bundle.ManifestId == Guid.Empty)
            throw new InvalidOperationException("ManifestId is required.");

        if (bundle.Artifacts.Count == 0)
            throw new InvalidOperationException("At least one artifact is required.");

        List<string> duplicateTypes = bundle.Artifacts
            .GroupBy(x => x.ArtifactType, StringComparer.OrdinalIgnoreCase)
            .Where(x => x.Count() > 1)
            .Select(x => x.Key)
            .ToList();

        if (duplicateTypes.Count > 0)
            throw new InvalidOperationException(
                $"Duplicate artifact types found: {string.Join(", ", duplicateTypes)}");

        foreach (SynthesizedArtifact artifact in bundle.Artifacts)
        {
            if (string.IsNullOrWhiteSpace(artifact.ArtifactType))
                throw new InvalidOperationException("ArtifactType is required.");

            if (string.IsNullOrWhiteSpace(artifact.Content))
                throw new InvalidOperationException("Artifact content is required.");

            if (string.IsNullOrWhiteSpace(artifact.ContentHash))
                throw new InvalidOperationException("Artifact content hash is required.");

            if (string.Equals(artifact.ArtifactType, ArtifactType.ArchitectureNarrative, StringComparison.OrdinalIgnoreCase)
                || string.Equals(artifact.ArtifactType, ArtifactType.ReferenceArchitectureMarkdown, StringComparison.OrdinalIgnoreCase))
            {
                IReadOnlyList<string> missing = ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders(artifact.Content);

                if (missing.Count > 0)
                    throw new InvalidOperationException(
                        $"Architecture artifact {artifact.ArtifactType} is missing required markdown ## headers: {string.Join(", ", missing)}. " +
                        "Each must appear as a line starting with \"## \" (second-level atx heading only).");
            }
        }
    }
}
