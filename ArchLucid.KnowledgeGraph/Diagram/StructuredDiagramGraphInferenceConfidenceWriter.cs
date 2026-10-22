using System.Globalization;

namespace ArchLucid.KnowledgeGraph.Diagram;

internal static class StructuredDiagramGraphInferenceConfidenceWriter
{
    internal static void Write(IDictionary<string, string> properties, double confidence) =>
        StructuredDiagramGraphCanonicalPropertyWriter.WriteString(
            properties,
            StructuredDiagramGraphPropertyKeys.InferenceConfidence,
            confidence.ToString("0.###", CultureInfo.InvariantCulture));
}
