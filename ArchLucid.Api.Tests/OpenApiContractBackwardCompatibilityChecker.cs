using System.Text;
using System.Text.Json.Nodes;

using Microsoft.OpenApi;
using Microsoft.OpenApi.Reader;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Ensures <paramref name="actualCanonicalRoot" /> is a non-breaking evolution of <paramref name="baselineCanonicalRoot" />:
///     no removed endpoints, parameters, responses, response media types, or schema fields incompatible with prior types.
///     Additive edits (extra paths, schemas, optional properties, widened unions with null, etc.) are allowed.
///     Validates that both snapshots parse cleanly using <see cref="OpenApiReaderSettings.AddJsonReader"/> +
///     <c>OpenApiModelFactory.Parse(..., OpenApiConstants.Json, …)</c> (bundled reader in Microsoft.OpenAPI.NET).
///     Structural drift is asserted on canonical <see cref="JsonNode"/> graphs for deterministic violation messages.
/// </summary>
internal static class OpenApiContractBackwardCompatibilityChecker
{
    internal static readonly IReadOnlyList<string> HttpOperationKeywords =
    [
        "get", "put", "post", "delete", "options", "head", "patch", "trace",
    ];

    /// <exception cref="InvalidOperationException">Document does not parse as OpenAPI (reader errors).</exception>
    internal static void ThrowIfUnreadable(JsonNode canonicalRoot, string label)
    {
        ArgumentNullException.ThrowIfNull(canonicalRoot);

        OpenApiReaderSettings settings = new();
        settings.AddJsonReader();

        string jsonText = canonicalRoot.ToJsonString();

        try
        {
            _ = OpenApiModelFactory.Parse(jsonText, OpenApiConstants.Json, settings);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"OpenAPI parse failed for {label}: {ex.Message}", ex);
        }
    }

    /// <summary>Delegates to xUnit <see cref="Assert.Fail(string)"/> with a summarized violation list when incompatible.</summary>
    internal static void AssertAdditiveCompatible(JsonObject baselineCanonicalRoot, JsonObject actualCanonicalRoot)
    {
        ArgumentNullException.ThrowIfNull(baselineCanonicalRoot);
        ArgumentNullException.ThrowIfNull(actualCanonicalRoot);

        List<string> violations = [];

        JsonObject baselineComponents = GetComponentsObjectOrEmpty(baselineCanonicalRoot);
        JsonObject actualComponents = GetComponentsObjectOrEmpty(actualCanonicalRoot);

        ComparePaths(violations, baselineCanonicalRoot, actualCanonicalRoot, baselineComponents, actualComponents);

        if (violations.Count <= 0)
            return;

        StringBuilder sb = new();
        sb.AppendLine("OpenAPI breaking change(s) versus committed snapshot baseline (additive changes are permitted):");

        foreach (string violation in violations)
            sb.Append(" - ").AppendLine(violation);

        Assert.Fail(sb.ToString());
    }

    private static JsonObject GetComponentsObjectOrEmpty(JsonObject root)
    {
        return root["components"] as JsonObject ?? [];
    }

    private static void ComparePaths(
        List<string> violations,
        JsonObject baselineRoot,
        JsonObject actualRoot,
        JsonObject baselineComponents,
        JsonObject actualComponents)
    {
        if (baselineRoot["paths"] is not JsonObject baselinePaths)
            return;

        if (actualRoot["paths"] is not JsonObject actualPaths)
        {
            violations.Add("Actual document is missing `paths` while snapshot defines paths.");
            return;
        }

        foreach (KeyValuePair<string, JsonNode?> pathPair in baselinePaths)
        {
            string pathKey = pathPair.Key;

            if (pathPair.Value is not JsonObject baselinePathItem)
                continue;

            if (!actualPaths.TryGetPropertyValue(pathKey, out JsonNode? actualPathNode) || actualPathNode is not JsonObject actualPathItem)
            {
                violations.Add($"Removed path `{pathKey}` (present in snapshot).");
                continue;
            }

            List<JsonObject> mergedActualParams = [];
            CollectParametersFromPathItem(actualPathItem, mergedActualParams);
            List<JsonObject> mergedBaselineParams = [];
            CollectParametersFromPathItem(baselinePathItem, mergedBaselineParams);

            foreach (string method in HttpOperationKeywords)
            {
                if (!baselinePathItem.TryGetPropertyValue(method, out JsonNode? baselineOpNode) || baselineOpNode is not JsonObject baselineOp)
                    continue;

                if (!actualPathItem.TryGetPropertyValue(method, out JsonNode? actualOpNode) || actualOpNode is not JsonObject actualOp)
                {
                    violations.Add($"Removed operation `{method.ToUpperInvariant()} {pathKey}` (present in snapshot).");
                    continue;
                }

                List<JsonObject> baselineParams = [.. mergedBaselineParams];
                CollectParametersFromOperation(baselineOp, baselineParams);

                List<JsonObject> actualParams = [.. mergedActualParams];
                CollectParametersFromOperation(actualOp, actualParams);

                CompareParameters(
                    violations,
                    $"{method.ToUpperInvariant()} {pathKey}",
                    baselineParams,
                    actualParams,
                    baselineComponents,
                    actualComponents);

                CompareRequestBody(
                    violations,
                    $"{method.ToUpperInvariant()} {pathKey}",
                    baselineOp,
                    actualOp,
                    baselineComponents,
                    actualComponents);

                CompareResponses(
                    violations,
                    $"{method.ToUpperInvariant()} {pathKey}",
                    baselineOp,
                    actualOp,
                    baselineComponents,
                    actualComponents);
            }
        }
    }

    private static void CollectParametersFromPathItem(JsonObject pathItem, List<JsonObject> sink)
    {
        if (pathItem["parameters"] is JsonArray array)
            AppendParameterObjects(array, sink);
    }

    private static void CollectParametersFromOperation(JsonObject operation, List<JsonObject> sink)
    {
        if (operation["parameters"] is JsonArray array)
            AppendParameterObjects(array, sink);
    }

    private static void AppendParameterObjects(JsonArray array, List<JsonObject> sink)
    {
        foreach (JsonNode? node in array)
        {
            if (node is JsonObject obj)
                sink.Add(obj);
        }
    }

    private static void CompareParameters(
        List<string> violations,
        string operationLabel,
        IReadOnlyList<JsonObject> baselineParams,
        IReadOnlyList<JsonObject> actualParams,
        JsonObject baselineComponents,
        JsonObject actualComponents)
    {
        foreach (JsonObject baselineParam in baselineParams)
        {
            string? name = baselineParam["name"]?.GetValue<string>();
            string? location = baselineParam["in"]?.GetValue<string>();

            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(location))
                continue;

            JsonObject? match = FindParameter(actualParams, name, location);

            if (match is null)
            {
                violations.Add($"{operationLabel}: removed parameter `{name}` (`in`={location}).");
                continue;
            }

            if (baselineParam["schema"] is { } baselineSchema && match["schema"] is { } actualSchema)
            {
                SchemaSubset.AssertSchemaCompatible(
                    violations,
                    $"{operationLabel} parameter `{name}` (`in`={location}) schema",
                    baselineSchema,
                    actualSchema,
                    baselineComponents,
                    actualComponents,
                    new HashSet<string>(StringComparer.Ordinal));
            }
        }
    }

    private static JsonObject? FindParameter(IReadOnlyList<JsonObject> parameters, string name, string location)
    {
        return (from param in parameters let n = param["name"]?.GetValue<string>() let l = param["in"]?.GetValue<string>() where string.Equals(n, name, StringComparison.Ordinal) && string.Equals(l, location, StringComparison.Ordinal) select param).FirstOrDefault();
    }

    private static void CompareRequestBody(
        List<string> violations,
        string operationLabel,
        JsonObject baselineOp,
        JsonObject actualOp,
        JsonObject baselineComponents,
        JsonObject actualComponents)
    {
        if (baselineOp["requestBody"] is not { } baselineBody)
            return;

        if (!actualOp.TryGetPropertyValue("requestBody", out JsonNode? actualBody) || actualBody is null)
        {
            violations.Add($"{operationLabel}: removed `requestBody` (present in snapshot).");
            return;
        }

        CompareContentSchemas(
            violations,
            operationLabel + " requestBody",
            baselineBody,
            actualBody,
            baselineComponents,
            actualComponents);
    }

    private static void CompareResponses(
        List<string> violations,
        string operationLabel,
        JsonObject baselineOp,
        JsonObject actualOp,
        JsonObject baselineComponents,
        JsonObject actualComponents)
    {
        if (baselineOp["responses"] is not JsonObject baselineResponses)
            return;

        if (!actualOp.TryGetPropertyValue("responses", out JsonNode? actualResponsesNode) || actualResponsesNode is not JsonObject actualResponses)
        {
            violations.Add($"{operationLabel}: removed `responses` section (present in snapshot).");
            return;
        }

        foreach (KeyValuePair<string, JsonNode?> responsePair in baselineResponses)
        {
            string status = responsePair.Key;

            if (responsePair.Value is not { } baselineResponseNode)
                continue;

            if (!actualResponses.TryGetPropertyValue(status, out JsonNode? actualResponseNode)
                || actualResponseNode is null)
            {
                violations.Add($"{operationLabel}: removed HTTP `{status}` response (present in snapshot).");
                continue;
            }

            CompareContentSchemas(
                violations,
                $"{operationLabel} response {status}",
                baselineResponseNode,
                actualResponseNode,
                baselineComponents,
                actualComponents);
        }
    }

    private static void CompareContentSchemas(
        List<string> violations,
        string context,
        JsonNode baselineResponseOrBody,
        JsonNode actualResponseOrBody,
        JsonObject baselineComponents,
        JsonObject actualComponents)
    {
        if (baselineResponseOrBody is not JsonObject baselineObj || actualResponseOrBody is not JsonObject actualObj)
            return;

        if (baselineObj["content"] is not JsonObject baselineContent)
            return;

        if (!actualObj.TryGetPropertyValue("content", out JsonNode? actualContentNode) || actualContentNode is not JsonObject actualContent)
        {
            violations.Add($"{context}: removed `content` map (snapshot documents media types).");
            return;
        }

        foreach (KeyValuePair<string, JsonNode?> contentPair in baselineContent)
        {
            string media = contentPair.Key;

            if (contentPair.Value is not JsonObject baselineMedia)
                continue;

            if (!baselineMedia.TryGetPropertyValue("schema", out JsonNode? baselineSchema))
                continue;

            if (!actualContent.TryGetPropertyValue(media, out JsonNode? actualMediaNode) || actualMediaNode is not JsonObject actualMedia)
            {
                violations.Add($"{context}: removed media type `{media}` schema (snapshot includes it).");
                continue;
            }

            if (!actualMedia.TryGetPropertyValue("schema", out JsonNode? actualSchema) || actualSchema is null)
            {
                violations.Add($"{context}: media `{media}` is missing `schema` (snapshot has one).");
                continue;
            }

            if (baselineSchema is null)
                continue;

            SchemaSubset.AssertSchemaCompatible(
                violations,
                $"{context} media `{media}` schema",
                baselineSchema,
                actualSchema,
                baselineComponents,
                actualComponents,
                new HashSet<string>(StringComparer.Ordinal));
        }
    }

    /// <summary>Schema subset + type-compat checks for OpenAPI / JSON Schema 3.1 shapes used in snapshots.</summary>
    private static class SchemaSubset
    {
        internal static void AssertSchemaCompatible(
            List<string> violations,
            string context,
            JsonNode baselineSchemaNode,
            JsonNode actualSchemaNode,
            JsonObject baselineComponents,
            JsonObject actualComponents,
            HashSet<string> refsVisited)
        {
            Dictionary<string, JsonObject> refCache = new(StringComparer.Ordinal);

            AssertSchemaCompatible(
                violations,
                context,
                baselineSchemaNode,
                actualSchemaNode,
                baselineComponents,
                actualComponents,
                refsVisited,
                refCache);
        }

        private static void AssertSchemaCompatible(
            List<string> violations,
            string context,
            JsonNode baselineSchemaNode,
            JsonNode actualSchemaNode,
            JsonObject baselineComponents,
            JsonObject actualComponents,
            HashSet<string> refsVisited,
            Dictionary<string, JsonObject> refCache)
        {
            if (!TryNormalizeToObject(
                    baselineSchemaNode,
                    baselineComponents,
                    actualComponents,
                    refsVisited,
                    refCache,
                    baseline: true,
                    out JsonObject baselineResolved))
            {
                violations.Add($"{context}: could not resolve baseline schema (malformed `$ref`).");
                return;
            }

            if (!TryNormalizeToObject(
                    actualSchemaNode,
                    baselineComponents,
                    actualComponents,
                    refsVisited,
                    refCache,
                    baseline: false,
                    out JsonObject actualResolved))
            {
                violations.Add($"{context}: could not resolve actual schema (malformed `$ref`).");
                return;
            }

            CompareSchemaObjects(
                violations,
                context,
                baselineResolved,
                actualResolved,
                baselineComponents,
                actualComponents,
                refsVisited,
                refCache);
        }

        /// <remarks>
        ///     <paramref name="baseline"/> selects which components dictionary is authoritative for refs inside that subtree.
        /// </remarks>
        private static bool TryNormalizeToObject(
            JsonNode node,
            JsonObject baselineComponents,
            JsonObject actualComponents,
            HashSet<string> refsVisited,
            Dictionary<string, JsonObject> refCache,
            bool baseline,
            out JsonObject result)
        {
            if (node is not JsonObject obj)
                return Fail(out result);

            if (obj.TryGetPropertyValue("$ref", out JsonNode? refNode) && refNode is JsonValue refVal)
            {
                string pointer = refVal.GetValue<string>();

                if (string.IsNullOrWhiteSpace(pointer))
                {
                    result = null!;
                    return false;
                }

                string refTag = (baseline ? "b:" : "a:") + pointer;

                if (refCache.TryGetValue(refTag, out JsonObject? cached))
                {
                    result = cached;
                    return true;
                }

                // Re-entering the same component while flattening indicates a cyclic $ref; keep the stub.
                if (!refsVisited.Add(refTag))
                {
                    result = obj;
                    return true;
                }

                try
                {
                    JsonObject comps = baseline ? baselineComponents : actualComponents;

                    if (!TryResolveJsonPointer(comps, pointer, out JsonNode? resolved) || resolved is not JsonObject target)
                        return Fail(out result);

                    JsonObject flattened = InlineRefShallowMerge(obj, target);

                    if (!TryNormalizeToObject(
                            flattened,
                            baselineComponents,
                            actualComponents,
                            refsVisited,
                            refCache,
                            baseline,
                            out result))
                    {
                        return false;
                    }

                    refCache[refTag] = result;
                    return true;
                }
                finally
                {
                    _ = refsVisited.Remove(refTag);
                }
            }

            result = obj;
            return true;

            static bool Fail(out JsonObject r)
            {
                r = null!;
                return false;
            }
        }

        /// <summary>
        ///     When OpenAPI nests keywords beside <c>$ref</c>, merge sibling keywords over the referenced object (later phase can
        ///     recurse deeper).
        /// </summary>
        private static JsonObject InlineRefShallowMerge(JsonObject withRef, JsonObject referenced)
        {
            JsonObject merged = [];

            foreach (KeyValuePair<string, JsonNode?> pair in referenced)
                merged[pair.Key] = CloneNode(pair.Value);

            foreach (KeyValuePair<string, JsonNode?> pair in withRef)
            {
                if (pair.Key.Equals("$ref", StringComparison.Ordinal))
                    continue;

                merged[pair.Key] = CloneNode(pair.Value);
            }

            return merged;
        }

        private static JsonNode? CloneNode(JsonNode? node) => node?.DeepClone();

        /// <summary>Resolves <c>#/components/schemas/&lt;name&gt;</c> only.</summary>
        private static bool TryResolveJsonPointer(JsonObject components, string pointer, out JsonNode? target)
        {
            target = null;

            string prefix = "#/components/schemas/";

            if (!pointer.StartsWith(prefix, StringComparison.Ordinal))
                return false;

            string name = pointer[prefix.Length..];

            if (string.IsNullOrEmpty(name))
                return false;

            return components["schemas"] is JsonObject schemas && schemas.TryGetPropertyValue(name, out target);
        }

        private static void CompareSchemaObjects(
            List<string> violations,
            string context,
            JsonObject baseline,
            JsonObject actual,
            JsonObject baselineComponents,
            JsonObject actualComponents,
            HashSet<string> refsVisited,
            Dictionary<string, JsonObject> refCache)
        {
            if (TryGetComponentSchemaRef(baseline, out string? baselineRef)
                && TryGetComponentSchemaRef(actual, out string? actualRef))
            {
                if (!string.Equals(baselineRef, actualRef, StringComparison.Ordinal))
                    violations.Add($"{context}: `$ref` changed (`{baselineRef}` → `{actualRef}`).");

                return;
            }

            CompareTypeTokens(violations, context + " → `type`", baseline, actual);
            CompareFormat(violations, context + " → `format`", baseline, actual);
            CompareEnumSubset(violations, context + " → `enum`", baseline, actual);

            CompareRequiredSubset(violations, context + " → `required`", baseline, actual);

            if (baseline.TryGetPropertyValue("properties", out JsonNode? bp) && bp is JsonObject baselineProps)
            {
                if (!actual.TryGetPropertyValue("properties", out JsonNode? ap) || ap is not JsonObject actualProps)
                {
                    violations.Add($"{context}: snapshot schema had `properties` but actual replaced it (object shape removed).");

                    return;
                }

                foreach (KeyValuePair<string, JsonNode?> propPair in baselineProps)
                {
                    string propName = propPair.Key;

                    if (!actualProps.TryGetPropertyValue(propName, out JsonNode? actualPropSchema))
                    {
                        violations.Add($"{context}: removed property `{propName}` from object schema.");

                        continue;
                    }

                    if (propPair.Value is not { } baselinePropSchema)
                        continue;

                    AssertSchemaCompatible(
                        violations,
                        $"{context}.properties.{propName}",
                        baselinePropSchema,
                        actualPropSchema!,
                        baselineComponents,
                        actualComponents,
                        refsVisited,
                        refCache);
                }
            }

            if (baseline.TryGetPropertyValue("items", out JsonNode? bItems) && bItems is not null)
            {
                if (!actual.TryGetPropertyValue("items", out JsonNode? aItems) || aItems is null)
                {
                    violations.Add($"{context}: removed `items` for array baseline schema.");
                    return;
                }

                AssertSchemaCompatible(
                    violations,
                    $"{context}.items",
                    bItems,
                    aItems,
                    baselineComponents,
                    actualComponents,
                    refsVisited,
                    refCache);
            }

            CompareCompositionBranch(violations, context + " → allOf", baseline, actual, baselineComponents,
                actualComponents, refsVisited, refCache,
                keyword: "allOf");

            CompareCompositionBranch(violations, context + " → anyOf", baseline, actual, baselineComponents,
                actualComponents, refsVisited, refCache,
                keyword: "anyOf");

            CompareCompositionBranch(violations, context + " → oneOf", baseline, actual, baselineComponents,
                actualComponents, refsVisited, refCache,
                keyword: "oneOf");

            CompareAdditionalProperties(
                violations,
                context,
                baseline,
                actual,
                baselineComponents,
                actualComponents,
                refsVisited,
                refCache);
        }

        private static bool TryGetComponentSchemaRef(JsonObject schema, out string? pointer)
        {
            pointer = null;

            if (!schema.TryGetPropertyValue("$ref", out JsonNode? refNode) || refNode is not JsonValue refVal)
                return false;

            pointer = refVal.GetValue<string>();

            return !string.IsNullOrWhiteSpace(pointer)
                && pointer.StartsWith("#/components/schemas/", StringComparison.Ordinal);
        }

        private static void CompareTypeTokens(List<string> violations, string context, JsonObject baseline, JsonObject actual)
        {
            if (!baseline.TryGetPropertyValue("type", out JsonNode? bTypeNode) || bTypeNode is null)
                return;

            if (!actual.TryGetPropertyValue("type", out JsonNode? aTypeNode) || aTypeNode is null)
            {
                violations.Add($"{context}: actual schema omits `type` while baseline documents it.");
                return;
            }

            HashSet<string> baselineTypes = NormalizeTypeTokens(bTypeNode);

            HashSet<string> actualTypes = NormalizeTypeTokens(aTypeNode);

            foreach (string token in baselineTypes)
            {
                if (!actualTypes.Contains(token))
                {
                    violations.Add($"{context}: type token `{token}` from snapshot is absent in actual (narrowing / type change).");
                }
            }
        }

        private static HashSet<string> NormalizeTypeTokens(JsonNode? node)
        {
            HashSet<string> set = new(StringComparer.Ordinal);

            if (node is null)
                return set;

            switch (node)
            {
                case JsonValue val:
                    string? token = TryGetPrimitiveString(val);

                    if (token is not null)
                        _ = set.Add(token);

                    break;

                case JsonArray array:

                    foreach (JsonNode? child in array)
                    {
                        if (child is JsonValue v && TryGetPrimitiveString(v) is { } fragment)
                            _ = set.Add(fragment);
                    }

                    break;
            }

            return set;
        }

        private static string? TryGetPrimitiveString(JsonValue value)
        {
            try
            {
                return value.GetValue<string>();
            }
            catch
            {
                return null;
            }
        }

        private static void CompareFormat(List<string> violations, string context, JsonObject baseline, JsonObject actual)
        {
            if (!baseline.TryGetPropertyValue("format", out JsonNode? bFmt) || bFmt is not JsonValue bVal)
                return;

            string? bf = TryGetPrimitiveString(bVal);

            if (string.IsNullOrWhiteSpace(bf))
                return;

            if (!actual.TryGetPropertyValue("format", out JsonNode? aFmt) || aFmt is not JsonValue aVal)
            {
                violations.Add($"{context}: snapshot used `format: {bf}` but actual omitted `format`.");
                return;
            }

            string? af = TryGetPrimitiveString(aVal);

            if (!string.Equals(bf, af, StringComparison.OrdinalIgnoreCase))
                violations.Add($"{context}: format changed (`{bf}` → `{af}`).");
        }

        private static void CompareEnumSubset(List<string> violations, string context, JsonObject baseline, JsonObject actual)
        {
            if (baseline["enum"] is not JsonArray baselineEnum)
                return;

            if (!actual.TryGetPropertyValue("enum", out JsonNode? aEnumNode) || aEnumNode is not JsonArray actualEnum)
            {
                violations.Add($"{context}: baseline documented `enum` but actual omitted it.");

                return;
            }

            violations.AddRange(from expected in baselineEnum let found = actualEnum.Any(candidate => JsonNode.DeepEquals(candidate, expected)) where !found select $"{context}: baseline enum entry `{expected}` missing from actual (breaking for clients relying on discriminator values).");
        }

        private static void CompareRequiredSubset(List<string> violations, string context, JsonObject baseline, JsonObject actual)
        {
            if (baseline["required"] is not JsonArray baseReq)
                return;

            foreach (JsonNode? nameNode in baseReq)
            {
                string? name = nameNode?.GetValue<string>();

                if (string.IsNullOrWhiteSpace(name))
                    continue;

                if (actual["required"] is not JsonArray actualReq)
                {
                    violations.Add($"{context}: baseline marked `{name}` as required but actual removed `required` array.");
                    continue;
                }

                bool kept = actualReq.Any(requirement => string.Equals(requirement?.GetValue<string>(), name, StringComparison.Ordinal));

                if (!kept)
                    violations.Add($"{context}: baseline property `{name}` was required but is no longer required (breaking consumer writes).");
            }
        }

        private static void CompareCompositionBranch(
            List<string> violations,
            string context,
            JsonObject baseline,
            JsonObject actual,
            JsonObject baselineComponents,
            JsonObject actualComponents,
            HashSet<string> refsVisited,
            Dictionary<string, JsonObject> refCache,
            string keyword)
        {
            if (baseline[keyword] is not JsonArray baselineBranches)
                return;

            if (!actual.TryGetPropertyValue(keyword, out JsonNode? actualBranchesNode) || actualBranchesNode is not JsonArray actualBranches)
            {
                violations.Add($"{context}: baseline used `{keyword}` but actual omitted it.");

                return;
            }

            if (baselineBranches.Count > actualBranches.Count)
            {
                violations.Add($"{context}: `{keyword}` branch count shrunk ({baselineBranches.Count} → {actualBranches.Count}), which can remove allowable shapes.");

                return;
            }

            bool[] consumed = new bool[actualBranches.Count];

            for (int i = 0; i < baselineBranches.Count; i++)
            {
                if (baselineBranches[i] is not { } bChild)
                    continue;

                bool matched = false;

                for (int j = 0; j < actualBranches.Count; j++)
                {
                    if (consumed[j])
                        continue;

                    if (actualBranches[j] is not { } aChild)
                        continue;

                    HashSet<string> trialRefs = new(refsVisited, StringComparer.Ordinal);
                    List<string> trial = [];

                    AssertSchemaCompatible(
                        trial,
                        $"{context} `{keyword}` branch match baseline#{i}->actual#{j}",
                        bChild,
                        aChild,
                        baselineComponents,
                        actualComponents,
                        trialRefs);

                    if (trial.Count != 0)
                        continue;

                    consumed[j] = true;
                    matched = true;
                    break;
                }

                if (!matched)
                    violations.Add($"{context}: no compatible `{keyword}` branch left for baseline entry #{i} (ordering / shape mismatch).");
            }
        }

        /// <remarks>
        ///     Baseline <c>additionalProperties: true</c> is the weakest constraint; narrowing to booleans/objects is
        ///     breaking unless equivalent. Widening away from snapshot <c>false</c> stays compatible with older clients that
        ///     tolerated only declared fields.
        /// </remarks>
        private static void CompareAdditionalProperties(
            List<string> violations,
            string context,
            JsonObject baseline,
            JsonObject actual,
            JsonObject baselineComponents,
            JsonObject actualComponents,
            HashSet<string> refsVisited,
            Dictionary<string, JsonObject> refCache)
        {
            if (!baseline.TryGetPropertyValue("additionalProperties", out JsonNode? bAdditional) || bAdditional is null)
                return;

            if (!actual.TryGetPropertyValue("additionalProperties", out JsonNode? aAdditional) || aAdditional is null)
            {
                violations.Add($"{context}: baseline constrained `additionalProperties` but actual removed the constraint.");

                return;
            }

            if (JsonNode.DeepEquals(bAdditional, aAdditional))
                return;

            if (IsAdditionalPropertiesBooleanTrue(bAdditional))
            {
                if (IsAdditionalPropertiesBooleanTrue(aAdditional))
                    return;

                violations.Add($"{context}: baseline allowed arbitrary `additionalProperties` but actual narrowed the rule.");

                return;
            }

            if (IsAdditionalPropertiesBooleanFalse(bAdditional))
            {
                return;
            }

            if (IsAdditionalPropertiesBooleanFalse(aAdditional))
            {
                violations.Add($"{context}: baseline described `additionalProperties` as a schema but actual forbids undeclared properties.");

                return;
            }

            AssertSchemaCompatible(
                violations,
                $"{context}.additionalProperties",
                bAdditional,
                aAdditional,
                baselineComponents,
                actualComponents,
                refsVisited,
                refCache);
        }

        private static bool IsAdditionalPropertiesBooleanTrue(JsonNode? node) =>
            node is JsonValue v && string.Equals(TryGetPrimitiveString(v), "true", StringComparison.Ordinal);

        private static bool IsAdditionalPropertiesBooleanFalse(JsonNode? node) =>
            node is JsonValue v && string.Equals(TryGetPrimitiveString(v), "false", StringComparison.Ordinal);
    }
}
