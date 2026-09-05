IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPacks', N'PackSlug') IS NOT NULL
BEGIN
    UPDATE dbo.PolicyPacks
    SET PackSlug = CASE Name
        WHEN N'Security Architecture Baseline' THEN N'security-architecture-baseline'
        WHEN N'Reliability and Resilience' THEN N'reliability-and-resilience'
        WHEN N'FinOps & Cloud Cost Optimization' THEN N'cost-optimization'
        WHEN N'Performance and Scalability' THEN N'performance-and-scalability'
        WHEN N'Operational Excellence' THEN N'operational-excellence'
        WHEN N'Sustainability and Resource Efficiency' THEN N'sustainability-and-resource-efficiency'
        WHEN N'AI Governance / Responsible AI' THEN N'ai-governance-responsible-ai'
        WHEN N'Azure Well-Architected Framework' THEN N'azure-waf'
        WHEN N'Azure Landing Zone / Cloud Adoption Framework' THEN N'azure-caf-landing-zone'
        WHEN N'CIS Microsoft Azure Foundations Benchmark' THEN N'cis-azure-foundations'
        WHEN N'AWS Well-Architected Framework' THEN N'aws-waf'
        WHEN N'Google Cloud Architecture Framework' THEN N'gcp-architecture-framework'
        WHEN N'CIS AWS Foundations Benchmark' THEN N'cis-aws-foundations'
        WHEN N'CIS Google Cloud Platform Foundation Benchmark' THEN N'cis-gcp-foundations'
        WHEN N'AWS IAM / Identity Center Architecture Baseline' THEN N'aws-iam-baseline'
        WHEN N'GCP Cloud IAM Architecture Baseline' THEN N'gcp-iam-baseline'
        WHEN N'AWS Landing Zone / Control Tower' THEN N'aws-landing-zone'
        WHEN N'GCP Landing Zone / Resource Hierarchy' THEN N'gcp-landing-zone'
        ELSE PackSlug
    END
    WHERE PackType = N'PlatformDefault'
      AND (PackSlug IS NULL OR LTRIM(RTRIM(PackSlug)) = N'');
END;
GO
