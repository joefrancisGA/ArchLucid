using System.Reflection;

namespace ArchLucid.Architecture.Tests.DependencyInjection;

/// <summary>
///     Collects interface constructor dependencies from MVC controllers and ASP.NET auth pipeline handlers.
/// </summary>
internal static class InjectableInterfaceConstructorParameterCollector
{
    public static IReadOnlyList<ConstructorInterfaceDependency> CollectFromType(Type hostType)
    {
        ArgumentNullException.ThrowIfNull(hostType);

        List<ConstructorInterfaceDependency> dependencies = [];

        foreach (ConstructorInfo constructor in hostType.GetConstructors(BindingFlags.Instance | BindingFlags.Public))
        {
            foreach (ParameterInfo parameter in constructor.GetParameters())
            {
                Type parameterType = parameter.ParameterType;

                if (!parameterType.IsInterface)
                    continue;

                if (FrameworkInjectableConstructorParameterTypes.IsExempt(parameterType))
                    continue;

                dependencies.Add(new ConstructorInterfaceDependency(hostType, parameterType, parameter.Name));
            }
        }

        return dependencies;
    }
}

internal readonly record struct ConstructorInterfaceDependency(
    Type HostType,
    Type InterfaceType,
    string? ParameterName);
