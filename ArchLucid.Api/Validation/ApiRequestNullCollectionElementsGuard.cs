using System.Collections;
using System.Reflection;

namespace ArchLucid.Api.Validation;

/// <summary>
///     Detects null elements inside JSON-deserialized request body collections before controller actions run.
/// </summary>
public static class ApiRequestNullCollectionElementsGuard
{
    public const string ValidationMessage =
        "Request body collections must not contain null elements.";

    /// <summary>
    ///     Returns true when <paramref name="root" /> contains a null element in any enumerable collection
    ///     (excluding strings and byte arrays).
    /// </summary>
    public static bool ContainsNullCollectionElement(object? root)
    {
        if (root is null)
            return false;

        HashSet<object> visited = new(ReferenceEqualityComparer.Instance);

        return Visit(root, visited);
    }

    private static bool Visit(object? value, HashSet<object> visited)
    {
        if (value is null)
            return false;

        Type type = value.GetType();

        if (IsLeafType(type))
            return false;

        if (IsEnumerableCollection(type))
        {
            foreach (object? element in (IEnumerable)value)
            {

                if (element is null)
                    return true;

                if (Visit(element, visited))
                    return true;
            }

            return false;
        }

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

            if (Visit(propertyValue, visited))
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
