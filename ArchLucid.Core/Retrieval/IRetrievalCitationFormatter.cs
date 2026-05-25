namespace ArchLucid.Core.Retrieval;

/// <summary>
///     Uniform citation shape <c>[corpus]/[id]@version</c> for Ask metadata, agent prompts, and export hooks.
/// </summary>
public interface IRetrievalCitationFormatter
{
    string Format(RetrievalHit hit);
}
