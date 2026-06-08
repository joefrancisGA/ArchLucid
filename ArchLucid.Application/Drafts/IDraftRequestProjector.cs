using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Drafts;

/// <summary>Projects an admitted draft into the canonical <see cref="ArchitectureRequest" /> (ADR 0042).</summary>
public interface IDraftRequestProjector
{
    ArchitectureRequest Project(DraftRequestDocument document, Guid draftId);
}
