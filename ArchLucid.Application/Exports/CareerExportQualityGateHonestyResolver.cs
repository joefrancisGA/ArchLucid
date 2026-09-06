using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Application.Exports;

/// <summary>Resolves host and run-recorded quality-gate posture for career export honesty (DR-05).</summary>
public static class CareerExportQualityGateHonestyResolver
{
    public static AgentOutputQualityGateMode ResolveHostMode(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        IConfigurationSection section = configuration.GetSection(AgentOutputQualityGateOptions.SectionPath);

        return section.GetValue<AgentOutputQualityGateMode>(nameof(AgentOutputQualityGateOptions.Mode));
    }

    public static string? ResolveHostAgentExecutionMode(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        string? raw = configuration["AgentExecution:Mode"]?.Trim();

        if (string.IsNullOrWhiteSpace(raw))
        {
            return "Simulator";
        }

        return raw;
    }

    public static AgentOutputQualityGateMode? ResolveRecordedGateMode(IReadOnlyList<AgentExecutionTrace> traces)
    {
        ArgumentNullException.ThrowIfNull(traces);

        AgentExecutionTrace? definitionTrace = traces
            .Where(static t => !string.IsNullOrWhiteSpace(t.QualityGateDefinitionMode))
            .OrderByDescending(static t => t.CreatedUtc)
            .FirstOrDefault();

        if (definitionTrace?.QualityGateDefinitionMode is not { } modeRaw)
        {
            return null;
        }

        if (Enum.TryParse(modeRaw, ignoreCase: true, out AgentOutputQualityGateMode parsed)
            && Enum.IsDefined(parsed))
        {
            return parsed;
        }

        return null;
    }

    public static AgentOutputQualityGateOutcome? ResolveAggregateOutcome(IReadOnlyList<AgentExecutionTrace> traces)
    {
        ArgumentNullException.ThrowIfNull(traces);

        AgentOutputQualityGateOutcome? worst = null;

        foreach (AgentExecutionTrace trace in traces)
        {
            if (trace.RecordedQualityGateOutcome is not { } outcome)
            {
                continue;
            }

            worst = worst is null ? outcome : PickWorse(worst.Value, outcome);
        }

        return worst;
    }

    private static AgentOutputQualityGateOutcome PickWorse(
        AgentOutputQualityGateOutcome a,
        AgentOutputQualityGateOutcome b)
    {
        return Rank(a) >= Rank(b) ? a : b;

        static int Rank(AgentOutputQualityGateOutcome x) => x switch
        {
            AgentOutputQualityGateOutcome.Rejected => 2,
            AgentOutputQualityGateOutcome.Warned => 1,
            _ => 0,
        };
    }
}
