using System.Collections;
using System.Reflection;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;

namespace ArchLucid.Api.Http;

/// <summary>
///     Discovers public API <c>[FromBody]</c> request types for architecture tests and guard coverage checks.
/// </summary>
public static class ApiRequestBodyTypeCatalog
{
    private static readonly NullabilityInfoContext NullabilityContext = new();

    public static bool CollectionPropertyAllowsNull(PropertyInfo property)
    {
        ArgumentNullException.ThrowIfNull(property);

        return NullabilityContext.Create(property).ReadState == NullabilityState.Nullable;
    }

    public static IReadOnlyList<Type> DiscoverFromBodyRequestTypes(Assembly apiAssembly)
    {
        ArgumentNullException.ThrowIfNull(apiAssembly);

        HashSet<Type> types = new();

        foreach (Type controllerType in apiAssembly.GetTypes())
        {

            if (!typeof(ControllerBase).IsAssignableFrom(controllerType) || controllerType.IsAbstract)
                continue;

            foreach (MethodInfo method in controllerType.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly))
            {

                foreach (ParameterInfo parameter in method.GetParameters())
                {

                    if (parameter.GetCustomAttribute<FromBodyAttribute>() is null)
                        continue;

                    Type parameterType = Nullable.GetUnderlyingType(parameter.ParameterType) ?? parameter.ParameterType;

                    if (parameterType == typeof(CancellationToken))
                        continue;

                    types.Add(parameterType);
                }
            }
        }

        return types.OrderBy(static type => type.FullName, StringComparer.Ordinal).ToList();
    }

    public static IEnumerable<(Type RequestType, string PropertyPath, PropertyInfo Property)> EnumerateCollectionPropertyPaths(
        Type requestType)
    {
        ArgumentNullException.ThrowIfNull(requestType);

        HashSet<Type> visitedTypes = new();

        return EnumerateCollectionPropertyPathsCore(requestType, string.Empty, visitedTypes);
    }

    private static IEnumerable<(Type, string, PropertyInfo)> EnumerateCollectionPropertyPathsCore(
        Type type,
        string prefix,
        HashSet<Type> visitedTypes)
    {

        if (!visitedTypes.Add(type))
            yield break;

        foreach (PropertyInfo property in type.GetProperties(BindingFlags.Instance | BindingFlags.Public))
        {

            if (!property.CanRead || property.GetIndexParameters().Length > 0)
                continue;

            Type propertyType = Nullable.GetUnderlyingType(property.PropertyType) ?? property.PropertyType;
            string path = string.IsNullOrEmpty(prefix) ? property.Name : prefix + "." + property.Name;

            if (IsEnumerableCollection(propertyType))
            {
                yield return (type, path, property);
            }

            if (!IsLeafType(propertyType) && !IsEnumerableCollection(propertyType))
            {
                foreach ((Type nestedType, string nestedPath, PropertyInfo nestedProperty) in EnumerateCollectionPropertyPathsCore(
                             propertyType,
                             path,
                             visitedTypes))
                {
                    yield return (nestedType, nestedPath, nestedProperty);
                }
            }
        }
    }

    private static bool IsLeafType(Type type)
    {
        if (type == typeof(string) || type == typeof(byte[]))
            return true;

        if (type.IsPrimitive || type.IsEnum)
            return true;

        if (type == typeof(decimal)
            || type == typeof(DateTime)
            || type == typeof(DateTimeOffset)
            || type == typeof(TimeSpan)
            || type == typeof(Guid))
        {
            return true;
        }

        return false;
    }

    private static bool IsEnumerableCollection(Type type)
    {
        if (type == typeof(string) || type == typeof(byte[]))
            return false;

        return typeof(IEnumerable).IsAssignableFrom(type);
    }
}
