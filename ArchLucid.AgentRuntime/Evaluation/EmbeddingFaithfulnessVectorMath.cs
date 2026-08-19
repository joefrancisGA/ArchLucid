namespace ArchLucid.AgentRuntime.Evaluation;

internal static class EmbeddingFaithfulnessVectorMath
{
    internal static double CosineSimilarity(ReadOnlySpan<float> a, ReadOnlySpan<float> b)
    {
        if (a.Length != b.Length || a.Length == 0)
            return 0;

        double dot = 0;
        double na = 0;
        double nb = 0;

        for (int i = 0; i < a.Length; i++)
        {
            double x = a[i];
            double y = b[i];
            dot += x * y;
            na += x * x;
            nb += y * y;
        }

        double denom = Math.Sqrt(na) * Math.Sqrt(nb);

        if (denom < 1e-12)
            return 0;

        return dot / denom;
    }

    /// <summary>Maps cosine [-1,1] to [0,1] for histogram emission.</summary>
    internal static double ToTelemetryUnitInterval(double cosine) =>
        Math.Clamp((cosine + 1.0) / 2.0, 0, 1);
}
