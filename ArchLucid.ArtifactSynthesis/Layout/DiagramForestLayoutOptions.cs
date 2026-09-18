namespace ArchLucid.ArtifactSynthesis.Layout;

public sealed class DiagramForestLayoutOptions
{
    public int NodeHeight
    {
        get;
        init;
    } = 36;

    /// <summary>Fallback empty component width only — not every node width.</summary>
    public int UniformNodeWidth
    {
        get;
        init;
    } = 280;

    public int MinNodeWidth
    {
        get;
        init;
    } = 160;

    public int MaxNodeWidth
    {
        get;
        init;
    } = 280;

    public int NodeHorizontalGap
    {
        get;
        init;
    } = 28;

    public int NodeVerticalGap
    {
        get;
        init;
    } = 20;

    /// <summary>Gap between disconnected components — a little more than intra-node gaps so groups read apart.</summary>
    public int ComponentHorizontalGap
    {
        get;
        init;
    } = 48;

    public int ComponentVerticalGap
    {
        get;
        init;
    } = 40;

    public int Padding
    {
        get;
        init;
    } = 16;

    public double CharacterWidth
    {
        get;
        init;
    } = 7.6;

    public int PictogramSize
    {
        get;
        init;
    } = 28;

    public int IconToLabelGap
    {
        get;
        init;
    } = 6;

    public int LineHeight
    {
        get;
        init;
    } = 16;

    public int NodePaddingX
    {
        get;
        init;
    } = 8;

    public int NodePaddingY
    {
        get;
        init;
    } = 6;
}
