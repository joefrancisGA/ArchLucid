namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Counts proper intersections between routed connector segments from different routes.</summary>
public static class DiagramEdgeCrossingCounter
{
    private const double AxisEpsilon = 0.001d;

    public static int Count(
        IReadOnlyList<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        if (routes.Count < 2)
        {
            return 0;
        }

        int crossings = 0;

        for (int leftRouteIndex = 0; leftRouteIndex < routes.Count; leftRouteIndex++)
        {
            IReadOnlyList<(double X1, double Y1, double X2, double Y2)> leftRoute = routes[leftRouteIndex];

            if (leftRoute is null)
            {
                continue;
            }

            for (int rightRouteIndex = leftRouteIndex + 1; rightRouteIndex < routes.Count; rightRouteIndex++)
            {
                IReadOnlyList<(double X1, double Y1, double X2, double Y2)> rightRoute = routes[rightRouteIndex];

                if (rightRoute is null)
                {
                    continue;
                }

                crossings += CountBetweenRoutes(leftRoute, rightRoute);
            }
        }

        return crossings;
    }

    public static int CountAgainst(
        IReadOnlyList<(double X1, double Y1, double X2, double Y2)> candidateSegments,
        IReadOnlyList<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> alreadyRouted)
    {
        ArgumentNullException.ThrowIfNull(candidateSegments);
        ArgumentNullException.ThrowIfNull(alreadyRouted);

        if (alreadyRouted.Count == 0)
        {
            return 0;
        }

        int crossings = 0;

        foreach (IReadOnlyList<(double X1, double Y1, double X2, double Y2)> existingRoute in alreadyRouted)
        {
            if (existingRoute is null)
            {
                continue;
            }

            crossings += CountBetweenRoutes(candidateSegments, existingRoute);
        }

        return crossings;
    }

    private static int CountBetweenRoutes(
        IReadOnlyList<(double X1, double Y1, double X2, double Y2)> leftRoute,
        IReadOnlyList<(double X1, double Y1, double X2, double Y2)> rightRoute)
    {
        int crossings = 0;

        foreach ((double leftX1, double leftY1, double leftX2, double leftY2) in leftRoute)
        {
            if (SegmentLengthSquared(leftX1, leftY1, leftX2, leftY2) < (AxisEpsilon * AxisEpsilon))
            {
                continue;
            }

            foreach ((double rightX1, double rightY1, double rightX2, double rightY2) in rightRoute)
            {
                if (SegmentLengthSquared(rightX1, rightY1, rightX2, rightY2) < (AxisEpsilon * AxisEpsilon))
                {
                    continue;
                }

                if (SegmentsProperlyIntersect(leftX1, leftY1, leftX2, leftY2, rightX1, rightY1, rightX2, rightY2))
                {
                    crossings++;
                }
            }
        }

        return crossings;
    }

    private static double SegmentLengthSquared(double x1, double y1, double x2, double y2)
    {
        double deltaX = x2 - x1;
        double deltaY = y2 - y1;

        return (deltaX * deltaX) + (deltaY * deltaY);
    }

    private static bool SegmentsProperlyIntersect(
        double ax1,
        double ay1,
        double ax2,
        double ay2,
        double bx1,
        double by1,
        double bx2,
        double by2)
    {
        if (!SegmentsIntersect(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2))
        {
            return false;
        }

        if (SegmentsShareEndpointOnly(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2))
        {
            return false;
        }

        return true;
    }

    private static bool SegmentsShareEndpointOnly(
        double ax1,
        double ay1,
        double ax2,
        double ay2,
        double bx1,
        double by1,
        double bx2,
        double by2)
    {
        bool sharesEndpoint = PointsEqual(ax1, ay1, bx1, by1)
            || PointsEqual(ax1, ay1, bx2, by2)
            || PointsEqual(ax2, ay2, bx1, by1)
            || PointsEqual(ax2, ay2, bx2, by2);

        if (!sharesEndpoint)
        {
            return false;
        }

        bool endpointOnOtherInterior =
            PointOnSegmentInterior(ax1, ay1, bx1, by1, bx2, by2)
            || PointOnSegmentInterior(ax2, ay2, bx1, by1, bx2, by2)
            || PointOnSegmentInterior(bx1, by1, ax1, ay1, ax2, ay2)
            || PointOnSegmentInterior(bx2, by2, ax1, ay1, ax2, ay2);

        return !endpointOnOtherInterior;
    }

    private static bool PointOnSegmentInterior(
        double px,
        double py,
        double x1,
        double y1,
        double x2,
        double y2)
    {
        if (!PointOnSegment(px, py, x1, y1, x2, y2))
        {
            return false;
        }

        if (PointsEqual(px, py, x1, y1) || PointsEqual(px, py, x2, y2))
        {
            return false;
        }

        return true;
    }

    private static bool PointsEqual(double ax, double ay, double bx, double by)
    {
        return Math.Abs(ax - bx) < AxisEpsilon && Math.Abs(ay - by) < AxisEpsilon;
    }

    private static bool SegmentsIntersect(
        double ax1,
        double ay1,
        double ax2,
        double ay2,
        double bx1,
        double by1,
        double bx2,
        double by2)
    {
        double orientationA = Orient(ax1, ay1, ax2, ay2, bx1, by1);
        double orientationB = Orient(ax1, ay1, ax2, ay2, bx2, by2);
        double orientationC = Orient(bx1, by1, bx2, by2, ax1, ay1);
        double orientationD = Orient(bx1, by1, bx2, by2, ax2, ay2);

        bool leftPointsOnOppositeSides = (orientationA > AxisEpsilon && orientationB < -AxisEpsilon)
            || (orientationA < -AxisEpsilon && orientationB > AxisEpsilon);
        bool rightPointsOnOppositeSides = (orientationC > AxisEpsilon && orientationD < -AxisEpsilon)
            || (orientationC < -AxisEpsilon && orientationD > AxisEpsilon);

        if (leftPointsOnOppositeSides && rightPointsOnOppositeSides)
        {
            return true;
        }

        if (Math.Abs(orientationA) < AxisEpsilon
            && PointOnSegment(bx1, by1, ax1, ay1, ax2, ay2))
        {
            return true;
        }

        if (Math.Abs(orientationB) < AxisEpsilon
            && PointOnSegment(bx2, by2, ax1, ay1, ax2, ay2))
        {
            return true;
        }

        if (Math.Abs(orientationC) < AxisEpsilon
            && PointOnSegment(ax1, ay1, bx1, by1, bx2, by2))
        {
            return true;
        }

        if (Math.Abs(orientationD) < AxisEpsilon
            && PointOnSegment(ax2, ay2, bx1, by1, bx2, by2))
        {
            return true;
        }

        return false;
    }

    private static double Orient(double px, double py, double qx, double qy, double rx, double ry)
    {
        return ((qy - py) * (rx - qx)) - ((qx - px) * (ry - qy));
    }

    private static bool PointOnSegment(double px, double py, double x1, double y1, double x2, double y2)
    {
        return px >= Math.Min(x1, x2) - AxisEpsilon
            && px <= Math.Max(x1, x2) + AxisEpsilon
            && py >= Math.Min(y1, y2) - AxisEpsilon
            && py <= Math.Max(y1, y2) + AxisEpsilon;
    }
}
