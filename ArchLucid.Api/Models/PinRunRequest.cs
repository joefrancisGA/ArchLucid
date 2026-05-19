namespace ArchLucid.Api.Models;

/// <summary>
///     Body for <c>PATCH /v1/architecture/run/{runId}/pin</c>. When <see cref="IsPinned" /> is omitted, the server toggles
///     the current pin state.
/// </summary>
public sealed class PinRunRequest
{
    /// <summary>Explicit pin state; when <see langword="null" />, toggles the stored value.</summary>
    public bool? IsPinned
    {
        get;
        set;
    }
}
