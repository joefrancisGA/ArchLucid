namespace ArchLucid.Retrieval.Indexing;

public sealed class PolicyPackCorpusIndexerOptions
{
    public const string SectionPath = "Retrieval:PolicyPackCorpus";

    public string PolicyPacksDirectory { get; set; } = "templates/policy-packs";

    public string RulesFileName { get; set; } = "compliance-rules.json";

    public bool IndexOnStartup { get; set; } = true;
}
