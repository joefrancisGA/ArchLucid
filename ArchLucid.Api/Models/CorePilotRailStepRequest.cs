namespace ArchLucid.Api.Models;

/// <summary>
///     Body for <c>POST /v1/diagnostics/core-pilot-rail-step</c>; records low-cardinality Core Pilot checklist telemetry.
/// </summary>
public sealed class CorePilotRailStepRequest
{
    /// <summary>Zero-based Core Pilot checklist index (wizard sequence on operator home).</summary>
    public int StepIndex { get; set; }
}
