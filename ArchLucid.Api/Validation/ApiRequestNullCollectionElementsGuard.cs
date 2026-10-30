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
        "Request body collection properties must not be null when required, and collections must not contain null elements.";

    /// <summary>
    ///     Returns true when <paramref name="root" /> has a null non-nullable collection property, or contains a null
    ///     element in any enumerable collection (excluding strings and byte arrays) whose element type is not annotated nullable.
    /// </summary>
    public static bool ContainsNullCollectionElement(object? root) =>
        ContainsNullCollectionElement(root, bodyParameter: null);

    /// <summary>
    ///     Validates a bound <c>[FromBody]</c> model. When the body parameter type is itself a collection (for example
    ///     batch JSON array roots), <paramref name="bodyParameter" /> supplies element nullability for that enumerable.
    /// </summary>
    public static bool ContainsNullCollectionElement(object? root, ParameterInfo? bodyParameter)
    {
        if (root is null)
            return false;

        HashSet<object> visited = new(ReferenceEqualityComparer.Instance);

        if (bodyParameter is not null
            && TryVisitRootBodyCollection(root, bodyParameter, visited, out bool rootInvalid)
            && rootInvalid)
        {
            return true;
        }

        return VisitObject(root, visited);
    }

    private static bool TryVisitRootBodyCollection(
        object root,
        ParameterInfo bodyParameter,
        HashSet<object> visited,
        out bool invalid)
    {
        invalid = false;
        Type parameterType = Nullable.GetUnderlyingType(bodyParameter.ParameterType) ?? bodyParameter.ParameterType;

        if (!IsEnumerableCollection(parameterType) || !parameterType.IsInstanceOfType(root))
            return false;

        NullabilityInfo parameterNullability = NullabilityContext.Create(bodyParameter);
        invalid = VisitCollection((IEnumerable)root, parameterNullability, visited);

        return true;
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
            {

                if (IsNullNonNullableCollectionProperty(property))
                    return true;

                continue;
            }

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

    private static bool VisitCollection(IEnumerable enumerable, PropertyInfo owningProperty, HashSet<object> visited) =>
        VisitCollection(enumerable, NullabilityContext.Create(owningProperty), visited);

    private static bool VisitCollection(IEnumerable enumerable, NullabilityInfo collectionNullability, HashSet<object> visited)
    {
        bool allowNullElements = AllowsNullElements(collectionNullability);

        foreach (object? element in enumerable)
        {

            if (element is null)
            {

                if (allowNullElements)
                    continue;

                return true;
            }

            if (TryVisitDictionaryEntryValue(element, collectionNullability, visited, out bool entryInvalid))
            {
                if (entryInvalid)
                    return true;

                continue;
            }

            Type elementRuntimeType = element.GetType();

            if (IsEnumerableCollection(elementRuntimeType))
            {
                NullabilityInfo? nestedCollectionNullability = collectionNullability.ElementType;

                if (nestedCollectionNullability is null && collectionNullability.GenericTypeArguments.Length > 0)
                    nestedCollectionNullability = collectionNullability.GenericTypeArguments[0];

                if (nestedCollectionNullability is not null
                    && VisitCollection((IEnumerable)element, nestedCollectionNullability, visited))
                {
                    return true;
                }

                continue;
            }

            if (VisitObject(element, visited))
                return true;
        }

        return false;
    }

    private static bool TryVisitDictionaryEntryValue(
        object element,
        NullabilityInfo collectionNullability,
        HashSet<object> visited,
        out bool entryInvalid)
    {
        entryInvalid = false;
        Type elementType = element.GetType();

        if (!elementType.IsGenericType || elementType.GetGenericTypeDefinition() != typeof(KeyValuePair<,>))
            return false;

        PropertyInfo? valueProperty = elementType.GetProperty(
            nameof(KeyValuePair<object, object>.Value),
            BindingFlags.Instance | BindingFlags.Public);

        if (valueProperty is null)
            return true;

        object? entryValue = valueProperty.GetValue(element);

        if (entryValue is null)
        {
            entryInvalid = !DictionaryValueAllowsNull(collectionNullability);

            return true;
        }

        entryInvalid = VisitObject(entryValue, visited);

        return true;
    }

    private static bool DictionaryValueAllowsNull(NullabilityInfo dictionaryNullability)
    {
        NullabilityInfo nullability = dictionaryNullability;

        if (nullability.GenericTypeArguments.Length >= 2)
            return AllowsNullProperty(nullability.GenericTypeArguments[1]);

        foreach (NullabilityInfo genericArgument in nullability.GenericTypeArguments)
        {

            if (genericArgument.ReadState == NullabilityState.Nullable)
                return true;
        }

        return false;
    }

    private static bool IsNullNonNullableCollectionProperty(PropertyInfo property)
    {
        Type propertyType = Nullable.GetUnderlyingType(property.PropertyType) ?? property.PropertyType;

        if (!IsEnumerableCollection(propertyType))
            return false;

        return !AllowsNullProperty(NullabilityContext.Create(property));
    }

    internal static bool AllowsNullProperty(NullabilityInfo nullability)
    {
        return nullability.ReadState == NullabilityState.Nullable;
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
