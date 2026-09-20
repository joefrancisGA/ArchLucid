namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>AABB overlap checks for resource-group frame bounds.</summary>
public static class DiagramResourceGroupFrameOverlap
{
    public const double Tolerance = 0.5d;

    public static bool Overlaps(
        DiagramResourceGroupPacker.ResourceGroupFrameBounds left,
        DiagramResourceGroupPacker.ResourceGroupFrameBounds right)
    {
        ArgumentNullException.ThrowIfNull(left);
        ArgumentNullException.ThrowIfNull(right);

        if (left.X + left.Width <= right.X + Tolerance)
        {
            return false;
        }

        if (right.X + right.Width <= left.X + Tolerance)
        {
            return false;
        }

        if (left.Y + left.Height <= right.Y + Tolerance)
        {
            return false;
        }

        if (right.Y + right.Height <= left.Y + Tolerance)
        {
            return false;
        }

        return true;
    }

    public static bool AnyOverlap(IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupFrameBounds> frames)
    {
        ArgumentNullException.ThrowIfNull(frames);

        for (int leftIndex = 0; leftIndex < frames.Count; leftIndex++)
        {
            for (int rightIndex = leftIndex + 1; rightIndex < frames.Count; rightIndex++)
            {
                if (Overlaps(frames[leftIndex], frames[rightIndex]))
                {
                    return true;
                }
            }
        }

        return false;
    }
}
