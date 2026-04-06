using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Contracts;

/// <summary>
/// JSON contract for <see cref="ArchLucid.Persistence.Compare.DiffItem"/>.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API contract DTO; no business logic.")]
public class DiffItemResponse
{
    /// <inheritdoc cref="ArchLucid.Persistence.Compare.DiffItem.Section"/>
    public string Section { get; set; } = null!;

    /// <inheritdoc cref="ArchLucid.Persistence.Compare.DiffItem.Key"/>
    public string Key { get; set; } = null!;

    /// <inheritdoc cref="ArchLucid.Persistence.Compare.DiffItem.DiffKind"/>
    public string DiffKind { get; set; } = null!;
    /// <inheritdoc cref="ArchLucid.Persistence.Compare.DiffItem.BeforeValue"/>
    public string? BeforeValue { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Compare.DiffItem.AfterValue"/>
    public string? AfterValue { get; set; }

    /// <inheritdoc cref="ArchLucid.Persistence.Compare.DiffItem.Notes"/>
    public string? Notes { get; set; }
}
