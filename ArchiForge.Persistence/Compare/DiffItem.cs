namespace ArchiForge.Persistence.Compare;

public class DiffItem
{
    public string Section { get; set; } = default!;
    public string Key { get; set; } = default!;
    public string DiffKind { get; set; } = default!;
    public string? BeforeValue { get; set; }
    public string? AfterValue { get; set; }
    public string? Notes { get; set; }
}
