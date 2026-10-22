using System.Text.Json;

namespace ArchLucid.Contracts.Operator;

/// <summary>
///     Serializable filter/sort/column-visibility state for an operator saved view.
/// </summary>
public sealed class OperatorSavedViewPayload
{
    /// <summary>Surface-specific filter object (audit search fields or graph mode/scope fields).</summary>
    public JsonElement Filters
    {
        get;
        set;
    }

    /// <summary>Optional sort descriptor (for example <c>occurredUtc:desc</c>).</summary>
    public string? Sort
    {
        get;
        set;
    }

    /// <summary>Optional column or panel visibility toggles for the surface.</summary>
    public JsonElement? ColumnVisibility
    {
        get;
        set;
    }
}
