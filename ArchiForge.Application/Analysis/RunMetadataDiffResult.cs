namespace ArchiForge.Application.Analysis;

public sealed class RunMetadataDiffResult
{
    public List<string> ChangedFields { get; set; } = [];

    public bool RequestIdsDiffer { get; set; }

    public bool ManifestVersionsDiffer { get; set; }

    public bool StatusDiffers { get; set; }

    public bool CompletionStateDiffers { get; set; }
}

