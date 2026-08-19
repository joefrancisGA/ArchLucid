namespace ArchLucid.Retrieval.FineTuning.Redaction;

/// <summary>Redacts accepted manifest text before fine-tuning export.</summary>
public interface IAcceptedManifestTrainingRedactor
{
    string RedactManifestText(string? input);
}
