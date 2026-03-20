namespace ArchiForge.Api.HttpContracts;

public class DiffItemResponse
{
    public string Section { get; set; } = default!;
    public string Key { get; set; } = default!;
    public string DiffKind { get; set; } = default!;
    public string? BeforeValue { get; set; }
    public string? AfterValue { get; set; }
    public string? Notes { get; set; }
}
