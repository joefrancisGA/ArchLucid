using System.Reflection;

using ArchLucid.Contracts.Abstractions.Agents;

namespace ArchLucid.Application.Agents;

/// <summary>Lists registered <see cref="IAgentHandler" /> implementations from DI (metadata only).</summary>
public interface IRegisteredAgentHandlersInspector
{
    IReadOnlyList<RegisteredAgentHandlerInfo> ListHandlers();
}

/// <summary>Discovery row for <see cref="IRegisteredAgentHandlersInspector" />.</summary>
public sealed class RegisteredAgentHandlerInfo
{
    public string AgentTypeKey
    {
        get;
        init;
    } = null!;

    public string AgentType
    {
        get;
        init;
    } = null!;

    public string ImplementationTypeName
    {
        get;
        init;
    } = null!;

    public string? AssemblyName
    {
        get;
        init;
    }

    public string? AssemblyVersion
    {
        get;
        init;
    }

    public string? Description
    {
        get;
        init;
    }
}

/// <inheritdoc cref="IRegisteredAgentHandlersInspector" />
public sealed class RegisteredAgentHandlersInspector(IEnumerable<IAgentHandler> handlers) : IRegisteredAgentHandlersInspector
{
    private readonly IReadOnlyList<IAgentHandler> _handlers =
        (handlers ?? throw new ArgumentNullException(nameof(handlers))).ToList();

    /// <inheritdoc />
    public IReadOnlyList<RegisteredAgentHandlerInfo> ListHandlers()
    {
        List<RegisteredAgentHandlerInfo> items = new(_handlers.Count);

        foreach (IAgentHandler handler in _handlers.OrderBy(h => h.AgentTypeKey, StringComparer.OrdinalIgnoreCase))
        {
            Type t = handler.GetType();

            Assembly asm = t.Assembly;
            string? informational =
                asm.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
                ?? asm.GetName().Version?.ToString();

            string? description = t.GetCustomAttribute<System.ComponentModel.DescriptionAttribute>()?.Description;

            items.Add(
                new RegisteredAgentHandlerInfo
                {
                    AgentTypeKey = handler.AgentTypeKey,
                    AgentType = handler.AgentType.ToString(),
                    ImplementationTypeName = t.FullName ?? t.Name,
                    AssemblyName = asm.GetName().Name,
                    AssemblyVersion = informational,
                    Description = description
                });
        }

        return items;
    }
}
