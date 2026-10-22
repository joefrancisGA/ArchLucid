using System.Text;
using System.Xml;

namespace ArchLucid.Cli.Commands;

/// <summary>Serializes <see cref="GraphWireModel"/> to GraphML (XML) for tools such as Gephi.</summary>
internal static class GraphWireGraphMlFormatter
{
    internal const string GraphMlNamespaceUri = "http://graphml.graphdrawing.org/xmlns";

    private const string XsiNamespaceUri = "http://www.w3.org/2001/XMLSchema-instance";

    internal static string ToGraphMl(GraphWireModel vm)
    {
        Dictionary<string, GraphNodeWire?> byRawId = BuildUnion(vm);
        Dictionary<string, string> encodedByRawId = EncodeDistinct(byRawId.Keys);

        UTF8Encoding utf8NoBom = new(encoderShouldEmitUTF8Identifier: false);
        XmlWriterSettings settings = new()
        {
            Indent = true,
            Encoding = utf8NoBom,
            OmitXmlDeclaration = false,
        };

        using MemoryStream ms = new();

        using (XmlWriter writer = XmlWriter.Create(ms, settings))
        {
            writer.WriteStartDocument();
            writer.WriteStartElement("graphml", GraphMlNamespaceUri);
            writer.WriteAttributeString("xmlns", "xsi", null, XsiNamespaceUri);
            writer.WriteAttributeString(
                "xsi",
                "schemaLocation",
                XsiNamespaceUri,
                "http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd");

            WriteKeys(writer);

            writer.WriteStartElement("graph", GraphMlNamespaceUri);
            writer.WriteAttributeString("id", "archlucid-provenance");
            writer.WriteAttributeString("edgedefault", "directed");

            foreach (string rawId in byRawId.Keys.OrderBy(static id => id, StringComparer.Ordinal))
            {
                GraphNodeWire? node = byRawId[rawId];
                string xmlNodeId = encodedByRawId[rawId];

                writer.WriteStartElement("node", GraphMlNamespaceUri);
                writer.WriteAttributeString("id", xmlNodeId);

                WriteDataElement(writer, "n-label", FormatNodeCaption(node));

                if (node is not null && node.Type.Trim().Length != 0)
                    WriteDataElement(writer, "n-type", node.Type.Trim());

                writer.WriteEndElement();
            }

            int edgeOrdinal = 0;

            foreach (GraphEdgeWire edge in vm.Edges.Where(static e =>
                         !string.IsNullOrWhiteSpace(e.Source) && !string.IsNullOrWhiteSpace(e.Target)))
            {
                string sourceKey = edge.Source.Trim();
                string targetKey = edge.Target.Trim();

                if (!encodedByRawId.TryGetValue(sourceKey, out string? sourceXmlId))
                    continue;

                if (!encodedByRawId.TryGetValue(targetKey, out string? targetXmlId))
                    continue;

                writer.WriteStartElement("edge", GraphMlNamespaceUri);
                writer.WriteAttributeString("id", "e" + edgeOrdinal.ToString(System.Globalization.CultureInfo.InvariantCulture));
                writer.WriteAttributeString("source", sourceXmlId);
                writer.WriteAttributeString("target", targetXmlId);

                if (edge.Type.Trim().Length != 0)
                    WriteDataElement(writer, "e-type", edge.Type.Trim());

                writer.WriteEndElement();

                edgeOrdinal++;
            }

            writer.WriteEndElement();
            writer.WriteEndElement();
            writer.WriteEndDocument();
        }

        return utf8NoBom.GetString(ms.ToArray());
    }

    private static Dictionary<string, GraphNodeWire?> BuildUnion(GraphWireModel vm)
    {
        Dictionary<string, GraphNodeWire?> byId = new(StringComparer.Ordinal);

        foreach (GraphNodeWire node in vm.Nodes.Where(static n => !string.IsNullOrWhiteSpace(n.Id)))
        {
            string id = node.Id.Trim();

            byId[id] = node;
        }

        foreach (GraphEdgeWire edge in vm.Edges.Where(static e =>
                     !string.IsNullOrWhiteSpace(e.Source) && !string.IsNullOrWhiteSpace(e.Target)))
        {
            string source = edge.Source.Trim();
            string target = edge.Target.Trim();

            if (!byId.ContainsKey(source))
                byId[source] = null;

            if (!byId.ContainsKey(target))
                byId[target] = null;
        }

        return byId;
    }

    private static Dictionary<string, string> EncodeDistinct(IEnumerable<string> rawIds)
    {
        Dictionary<string, string> map = new(StringComparer.Ordinal);
        HashSet<string> usedXmlIds = new(StringComparer.Ordinal);

        foreach (string rawId in rawIds)
        {
            string trimmed = rawId.Trim();

            if (trimmed.Length == 0)
                continue;

            string xmlToken = XmlConvert.EncodeNmToken(trimmed);

            if (xmlToken.Length == 0)
                xmlToken = "_empty";

            string candidate = xmlToken;
            int suffix = 2;

            while (!usedXmlIds.Add(candidate))
            {
                candidate = xmlToken + "_" + suffix.ToString(System.Globalization.CultureInfo.InvariantCulture);

                suffix++;
            }

            map[trimmed] = candidate;
        }

        return map;
    }

    private static string FormatNodeCaption(GraphNodeWire? node)
    {
        const string unknown = "?";

        if (node is null)
            return unknown;

        StringBuilder caption = new();

        if (!string.IsNullOrWhiteSpace(node.Label))
            caption.Append(node.Label.Trim());

        if (!string.IsNullOrWhiteSpace(node.Type))
        {
            if (caption.Length != 0)
                caption.Append(" :: ");

            caption.Append(node.Type.Trim());
        }

        string text = caption.ToString();

        return text.Length != 0 ? text : unknown;
    }

    private static void WriteKeys(XmlWriter writer)
    {
        WriteKeyDeclaration(writer, "n-label", "node", "label", "string");
        WriteKeyDeclaration(writer, "n-type", "node", "nodeKind", "string");
        WriteKeyDeclaration(writer, "e-type", "edge", "relation", "string");
    }

    private static void WriteKeyDeclaration(
        XmlWriter writer,
        string keyId,
        string forScope,
        string attrName,
        string attrType)
    {
        writer.WriteStartElement("key", GraphMlNamespaceUri);
        writer.WriteAttributeString("id", keyId);
        writer.WriteAttributeString("for", forScope);
        writer.WriteAttributeString("attr.name", attrName);
        writer.WriteAttributeString("attr.type", attrType);
        writer.WriteEndElement();
    }

    private static void WriteDataElement(XmlWriter writer, string keyId, string value)
    {
        writer.WriteStartElement("data", GraphMlNamespaceUri);
        writer.WriteAttributeString("key", keyId);
        writer.WriteString(value);
        writer.WriteEndElement();
    }
}
