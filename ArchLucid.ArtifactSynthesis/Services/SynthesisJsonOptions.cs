using System.Text.Json;

namespace ArchLucid.ArtifactSynthesis.Services;

internal static class SynthesisJsonOptions
{
    public static readonly JsonSerializerOptions WriteIndented = new() { WriteIndented = true };
}
