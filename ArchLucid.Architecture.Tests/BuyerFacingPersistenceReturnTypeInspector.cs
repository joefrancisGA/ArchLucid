using System.Reflection;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Detects declared response types that leak <c>ArchLucid.Persistence.*</c> on buyer-facing HTTP actions.
/// </summary>
internal static class BuyerFacingPersistenceReturnTypeInspector
{
    private const string PersistenceNamespacePrefix = "ArchLucid.Persistence";

    internal static IEnumerable<string> FindViolations(BuyerFacingControllerRouteScanner.BuyerFacingAction action)
    {
        List<string> violations = [];

        foreach (ProducesResponseTypeAttribute produces in action.Method.GetCustomAttributes<ProducesResponseTypeAttribute>(inherit: true))
        {
            if (produces.StatusCode is < 200 or >= 300)
                continue;

            if (TryDescribePersistenceLeak(produces.Type, out string? description))
                violations.Add($"{action.Controller.FullName}.{action.Method.Name} [{action.RelativePath}] ProducesResponseType({description})");
        }

        foreach (Type declaredType in EnumerateDeclaredReturnTypes(action.Method.ReturnType))
        {
            if (TryDescribePersistenceLeak(declaredType, out string? description))
                violations.Add($"{action.Controller.FullName}.{action.Method.Name} [{action.RelativePath}] return type {description}");
        }

        return violations.Distinct(StringComparer.Ordinal);
    }

    private static IEnumerable<Type> EnumerateDeclaredReturnTypes(Type returnType)
    {
        Type? unwrapped = UnwrapTaskLike(returnType);

        if (unwrapped is null)
            yield break;

        if (unwrapped == typeof(IActionResult) || unwrapped == typeof(ActionResult))
            yield break;

        if (unwrapped.IsGenericType)
        {
            Type genericDefinition = unwrapped.GetGenericTypeDefinition();

            if (genericDefinition == typeof(ActionResult<>) || genericDefinition == typeof(Task<>) || genericDefinition == typeof(ValueTask<>))
            {
                Type payload = unwrapped.GetGenericArguments()[0];
                yield return payload;

                yield break;
            }
        }

        yield return unwrapped;
    }

    private static Type? UnwrapTaskLike(Type type)
    {
        if (type == typeof(Task) || type == typeof(ValueTask))
            return null;

        if (type.IsGenericType)
        {
            Type genericDefinition = type.GetGenericTypeDefinition();

            if (genericDefinition == typeof(Task<>) || genericDefinition == typeof(ValueTask<>))
                return type.GetGenericArguments()[0];
        }

        return type;
    }

    private static bool TryDescribePersistenceLeak(Type? type, out string description)
    {
        description = string.Empty;

        if (type is null || type == typeof(void))
            return false;

        if (type.Namespace?.StartsWith(PersistenceNamespacePrefix, StringComparison.Ordinal) == true)
        {
            description = type.FullName ?? type.Name;
            return true;
        }

        if (type.IsGenericType)
        {
            foreach (Type argument in type.GetGenericArguments())
            {
                if (TryDescribePersistenceLeak(argument, out string nested))
                {
                    description = $"{type.Name}<{nested}>";
                    return true;
                }
            }
        }

        if (type.IsArray)
        {
            Type element = type.GetElementType()!;

            if (TryDescribePersistenceLeak(element, out string nested))
            {
                description = $"{nested}[]";
                return true;
            }
        }

        return false;
    }
}
