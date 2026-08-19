using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Packaging;

public interface IArtifactContentTypeResolver
{
    string Resolve(SynthesizedArtifact artifact);
}
