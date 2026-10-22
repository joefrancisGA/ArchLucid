namespace ArchLucid.Persistence.Coordination.ProductLearning;

public static partial class ProductLearningSignalAggregations
{
    /// <summary>Matches SQL <c>AggregateKeyExpr</c> for grouped rollups.</summary>
    public static string BuildAggregateKey(string? patternKey, string subjectType, string? artifactHint)
    {
        if (!string.IsNullOrWhiteSpace(patternKey))
            return patternKey.Trim();


        string artifact = string.IsNullOrWhiteSpace(artifactHint) ? "--" : artifactHint.Trim();

        return "subject:" + subjectType + "|artifact:" + artifact;
    }

    /// <summary>Normalized comment prefix for theme grouping (deterministic).</summary>
    public static string? NormalizeCommentThemeKey(string? commentShort)
    {
        if (string.IsNullOrWhiteSpace(commentShort))
            return null;

        string trimmed = commentShort.Trim();

        if (trimmed.Length == 0)
            return null;

        return trimmed.Length <= CommentThemePrefixLength ? trimmed : trimmed[..CommentThemePrefixLength];
    }

    /// <summary>Matches SQL trend key: subject + artifact facet.</summary>
    public static string BuildTrendKey(string subjectType, string? artifactHint)
    {
        string artifact = string.IsNullOrWhiteSpace(artifactHint) ? "*" : artifactHint.Trim();

        return subjectType + "|" + artifact;
    }

    /// <summary>Display hint for artifact trend row.</summary>
    public static string BuildArtifactTypeOrHint(string subjectType, string? artifactHint)
    {
        return !string.IsNullOrWhiteSpace(artifactHint) ? artifactHint.Trim() : subjectType;
    }
}
