namespace ArchLucid.Contracts.Persistence.Context;

public class InfrastructureDeclarationReference
{
    public string DeclarationId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    public string Name
    {
        get;
        set;
    } = null!;

    /// <summary>Supported v1 values: <c>json</c>, <c>simple-terraform</c>, <c>terraform-show-json</c>, <c>bicep</c>, <c>arm-json</c>, <c>kubernetes-json</c>, <c>kubernetes-yaml</c>.</summary>
    public string Format
    {
        get;
        set;
    } = "json";

    public string Content
    {
        get;
        set;
    } = null!;
}
