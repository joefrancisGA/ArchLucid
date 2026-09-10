namespace ArchLucid.Decisioning.Analysis;

/// <summary>One inbound admin-port rule exposed to the internet parsed from a segmentation control property bag.</summary>
public sealed record SegmentationRiskyRule(int DestinationPort, string MatchedPropertyKey);
