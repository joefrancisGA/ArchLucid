using ArchLucid.Core.DevTesting;

namespace ArchLucid.Application.Tests.Support;

/// <summary>Test double for <see cref="IEffectiveAgentExecutionModeAccessor" />.</summary>
public sealed class FixedEffectiveAgentExecutionModeAccessor(string mode = "Simulator") : IEffectiveAgentExecutionModeAccessor
{
    public string GetEffectiveMode() => mode;
}
