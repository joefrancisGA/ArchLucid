namespace ArchLucid.Core.AiUsage;

public static class AmbientAiUsageFeatureScope
{
    private static readonly AsyncLocal<AiUsageFeature?> CurrentFeature = new();

    public static AiUsageFeature Current => CurrentFeature.Value ?? AiUsageFeature.ReviewAnalysis;

    public static IDisposable Push(AiUsageFeature feature)
    {
        AiUsageFeature? prior = CurrentFeature.Value;
        CurrentFeature.Value = feature;

        return new PopScope(prior);
    }

    private sealed class PopScope(AiUsageFeature? prior) : IDisposable
    {
        public void Dispose()
        {
            CurrentFeature.Value = prior;
        }
    }
}
