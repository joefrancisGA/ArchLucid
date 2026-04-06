using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Interfaces;

public interface IArtifactBundleValidator
{
    void Validate(ArtifactBundle bundle);
}
