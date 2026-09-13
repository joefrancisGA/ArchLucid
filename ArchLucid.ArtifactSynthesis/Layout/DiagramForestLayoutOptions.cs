namespace ArchLucid.ArtifactSynthesis.Layout;

public sealed class DiagramForestLayoutOptions
{
    public int NodeHeight
    {
        get;
        init;
    } = 36;

    public int MinNodeWidth
    {
        get;
        init;
    } = 72;

    public int MaxNodeWidth
    {
        get;
        init;
    } = 220;

    public int HorizontalGap
    {
        get;
        init;
    } = 24;

    public int VerticalGap
    {
        get;
        init;
    } = 20;

    public int Padding
    {
        get;
        init;
    } = 12;

    public double CharacterWidth
    {
        get;
        init;
    } = 7.2;
}
