namespace ArchLucid.TestSupport.TechnologyConsistency;

/// <summary>Resolves the technology-consistency golden corpus copied to test output.</summary>
public static class TechnologyConsistencyCorpusPaths
{
    public static string CorpusRoot =>
        Path.Combine(AppContext.BaseDirectory, "technology-consistency-corpus");

    public static string ManifestPath =>
        Path.Combine(CorpusRoot, "manifest.json");

    public static string ScenarioDirectory(string relativePath) =>
        Path.Combine(CorpusRoot, relativePath);
}
