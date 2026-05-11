namespace ArchLucid.AgentRuntime.Tests.DriftDetection;

/// <summary>
///     Marker: drift scenario requires live Azure OpenAI credentials. Actual skipping uses <c>xunit.skippablefact</c>
///     with <see cref="GoldenCohortRealModeGate.CanRunRealModeDrift" /> — this attribute documents intent for CI filters.
/// </summary>
[AttributeUsage(AttributeTargets.Method)]
public sealed class SkipIfNoRealModeAttribute : Attribute;
