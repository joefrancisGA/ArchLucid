using System.Collections;
using System.Reflection;

namespace ArchLucid.Api.Validation;

/// <summary>
///     Detects null elements inside JSON-deserialized request body collections before controller actions run.
/// </summary>
public static class ApiRequestNullCollectionElementsGuard
{
    private static readonly NullabilityInfoContext NullabilityContext = new();

    public const string ValidationMessage =
        "Request body collections must not contain null elements.";

    /// <summary>
    ///     Returns true when <paramref name="root" /> contains a null element in any enumerable collection
    ///     (excluding strings and byte arrays) whose element type is not annotated nullable.
    /// </summary>
    public static bool ContainsNullCollectionElement(object? root)
    {
        if (root is null)
            return false;

        HashSet<object> visited = new(ReferenceEqualityComparer.Instance);

        return VisitObject(root, visited);
    }

    private static bool VisitObject(object value, HashSet<object> visited)
    {
        Type type = value.GetType();

        if (IsLeafType(type))
            return false;

        if (!type.IsValueType)
        {

            if (!visited.Add(value))
                return false;
        }

        foreach (PropertyInfo property in type.GetProperties(BindingFlags.Instance | BindingFlags.Public))
        {

            if (!property.CanRead || property.GetIndexParameters().Length > 0)
                continue;

            if (property.GetCustomAttribute<SkipNullCollectionElementValidationAttribute>() is not null)
                continue;

            object? propertyValue = property.GetValue(value);

            if (propertyValue is null)
                continue;

            if (VisitPropertyValue(propertyValue, property, visited))
                return true;
        }

        return false;
    }

    private static bool VisitPropertyValue(object value, PropertyInfo property, HashSet<object> visited)
    {
        Type runtimeType = value.GetType();

        if (IsEnumerableCollection(runtimeType))
            return VisitCollection((IEnumerable)value, property, visited);

        if (IsLeafType(runtimeType))
            return false;

        return VisitObject(value, visited);
    }

    private static bool VisitCollection(IEnumerable enumerable, PropertyInfo owningProperty, HashSet<object> visited)
    {
        bool allowNullElements = AllowsNullElements(NullabilityContext.Create(owningProperty));

        foreach (object? element in enumerable)
        {

            if (element is null)
            {

                if (allowNullElements)
                    continue;

                return true;
            }

            if (VisitObject(element, visited))
                return true;
        }

        return false;
    }

    internal static bool AllowsNullElements(NullabilityInfo nullability)
    {
        NullabilityInfo? elementInfo = nullability.ElementType;

        while (elementInfo is not null)
        {

            if (elementInfo.ReadState == NullabilityState.Nullable)
                return true;

            elementInfo = elementInfo.ElementType;
        }

        foreach (NullabilityInfo genericArgument in nullability.GenericTypeArguments)
        {

            if (genericArgument.ReadState == NullabilityState.Nullable)
                return true;
        }

        return false;
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
