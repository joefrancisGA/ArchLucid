using System.Reflection;

using ArchLucid.Api.Controllers.Integrations;
using ArchLucid.Application.Integrations.AzureBoards.Outbound;
using ArchLucid.Application.Integrations.Itsm.Outbound;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-397: API controllers must not reference outbound vendor HTTP client types directly.</summary>
[Trait("Suite", "Architecture")]
[Trait("Category", "Unit")]
public sealed class ExternalTicketConnectorApiBoundaryArchitectureTests
{
    private static readonly HashSet<Type> ForbiddenVendorHttpTypes =
    [
        typeof(JiraOutboundIssueClient),
        typeof(ServiceNowOutboundIncidentClient),
        typeof(AzureBoardsOutboundIssueClient)
    ];

    [Fact]
    public void Api_integration_controllers_do_not_reference_outbound_vendor_http_client_types()
    {
        Assembly apiAssembly = typeof(ItsmOutboundIssuesController).Assembly;

        List<string> violations =
        [
            .. apiAssembly.GetTypes()
                .Where(static type => type.IsClass && type.Namespace?.Contains("Controllers", StringComparison.Ordinal) == true)
                .SelectMany(FindForbiddenTypeReferences)
        ];

        violations.Should().BeEmpty(
            "TB-397: outbound vendor HTTP clients belong behind IExternalTicketConnector implementations: "
            + string.Join("; ", violations));
    }

    private static IEnumerable<string> FindForbiddenTypeReferences(Type controllerType)
    {
        foreach (FieldInfo field in controllerType.GetFields(BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic))
        {
            if (ReferencesForbiddenType(field.FieldType))
                yield return $"{controllerType.FullName}.{field.Name} field";
        }

        foreach (PropertyInfo property in controllerType.GetProperties(BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic))
        {
            if (ReferencesForbiddenType(property.PropertyType))
                yield return $"{controllerType.FullName}.{property.Name} property";
        }

        foreach (MethodInfo method in controllerType.GetMethods(BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.DeclaredOnly))
        {
            if (ReferencesForbiddenType(method.ReturnType))
                yield return $"{controllerType.FullName}.{method.Name} return";

            foreach (ParameterInfo parameter in method.GetParameters())
            {
                if (ReferencesForbiddenType(parameter.ParameterType))
                    yield return $"{controllerType.FullName}.{method.Name}({parameter.Name})";
            }
        }

        foreach (ConstructorInfo constructor in controllerType.GetConstructors(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic))
        {
            foreach (ParameterInfo parameter in constructor.GetParameters())
            {
                if (ReferencesForbiddenType(parameter.ParameterType))
                    yield return $"{controllerType.FullName}..ctor({parameter.Name})";
            }
        }
    }

    private static bool ReferencesForbiddenType(Type candidate)
    {
        if (ForbiddenVendorHttpTypes.Contains(candidate))
            return true;

        if (!candidate.IsGenericType)
            return false;

        return candidate.GetGenericArguments().Any(ReferencesForbiddenType);
    }
}
