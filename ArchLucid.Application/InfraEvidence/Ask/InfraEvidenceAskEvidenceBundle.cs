using ArchLucid.Contracts.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Ask;

public sealed class InfraEvidenceAskEvidenceBundle
{
    public string TopicKind
    {
        get;
        init;
    } = string.Empty;

    public List<InfraEvidenceAskCitation> Citations
    {
        get;
    } = [];

    public List<string> EvidenceLines
    {
        get;
    } = [];

    public bool HasEvidence => Citations.Count > 0;

    public void AddCitation(string kind, string id, string? label, string evidenceLine)
    {
        Citations.Add(new InfraEvidenceAskCitation
        {
            Kind = kind,
            Id = id,
            Label = label,
        });

        EvidenceLines.Add(evidenceLine);
    }
}
