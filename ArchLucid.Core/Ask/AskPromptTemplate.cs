namespace ArchLucid.Core.Ask;

/// <summary>Starter prompt for the grounded Ask assistant (Improvement #11).</summary>
public sealed class AskPromptTemplate
{
    public string Id
    {
        get;
        set;
    } = string.Empty;

    public string Title
    {
        get;
        set;
    } = string.Empty;

    public string Prompt
    {
        get;
        set;
    } = string.Empty;
}
