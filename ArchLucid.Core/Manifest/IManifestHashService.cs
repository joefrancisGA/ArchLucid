using ArchLucid.Core.Manifest;

namespace ArchLucid.Core.Manifest;

/// <summary>
///     Computes a deterministic hash over canonical manifest content (shared by decision engine and authority replay).
/// </summary>
public interface IManifestHashService
{
    string ComputeHash(ManifestDocument manifest);
}
