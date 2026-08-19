-- Prompt A/B variants (host catalog) and per-result variant attribution for evaluation stats.

IF OBJECT_ID(N'dbo.PromptVariants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PromptVariants
    (
        VariantId            INT              NOT NULL IDENTITY(1, 1),
        PromptTemplateName   NVARCHAR(128)    NOT NULL,
        VariantKey           NVARCHAR(64)     NOT NULL,
        WeightBps            INT              NOT NULL,
        PromptBody           NVARCHAR(MAX)    NULL,
        IsActive             BIT              NOT NULL
            CONSTRAINT DF_PromptVariants_IsActive DEFAULT (1),
        CreatedUtc           DATETIME2        NOT NULL,
        RetiredUtc           DATETIME2        NULL,
        CONSTRAINT PK_PromptVariants PRIMARY KEY (VariantId),
        CONSTRAINT CK_PromptVariants_WeightBps CHECK (WeightBps >= 0 AND WeightBps <= 10000)
    );

    CREATE UNIQUE NONCLUSTERED INDEX UX_PromptVariants_Template_VariantKey
        ON dbo.PromptVariants (PromptTemplateName, VariantKey);

    CREATE NONCLUSTERED INDEX IX_PromptVariants_Template_Active
        ON dbo.PromptVariants (PromptTemplateName, IsActive)
        WHERE RetiredUtc IS NULL;
END

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.AgentResults', N'PromptVariantKey') IS NULL
        ALTER TABLE dbo.AgentResults ADD PromptVariantKey NVARCHAR(64) NULL;
END

IF OBJECT_ID(N'dbo.AgentOutputEvaluations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentOutputEvaluations
    (
        EvaluationId         UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_AgentOutputEvaluations_EvaluationId DEFAULT (NEWSEQUENTIALID()),
        ResultId             NVARCHAR(64)     NULL,
        RunId                NVARCHAR(64)     NOT NULL,
        PromptTemplateName   NVARCHAR(128)    NOT NULL,
        PromptVariantKey     NVARCHAR(64)     NOT NULL,
        AgentType            NVARCHAR(50)     NOT NULL,
        SemanticScore        FLOAT            NOT NULL,
        QualityGatePassed    BIT              NOT NULL,
        CreatedUtc           DATETIME2        NOT NULL,
        CONSTRAINT PK_AgentOutputEvaluations PRIMARY KEY (EvaluationId)
    );

    CREATE NONCLUSTERED INDEX IX_AgentOutputEvaluations_Template_Variant
        ON dbo.AgentOutputEvaluations (PromptTemplateName, PromptVariantKey, CreatedUtc DESC);
END

-- Baseline variants (NULL PromptBody => built-in template text at runtime).
IF NOT EXISTS (SELECT 1 FROM dbo.PromptVariants WHERE PromptTemplateName = N'topology-system' AND VariantKey = N'baseline')
    INSERT INTO dbo.PromptVariants (PromptTemplateName, VariantKey, WeightBps, PromptBody, IsActive, CreatedUtc)
    VALUES (N'topology-system', N'baseline', 10000, NULL, 1, SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM dbo.PromptVariants WHERE PromptTemplateName = N'compliance-system' AND VariantKey = N'baseline')
    INSERT INTO dbo.PromptVariants (PromptTemplateName, VariantKey, WeightBps, PromptBody, IsActive, CreatedUtc)
    VALUES (N'compliance-system', N'baseline', 10000, NULL, 1, SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM dbo.PromptVariants WHERE PromptTemplateName = N'critic-system' AND VariantKey = N'baseline')
    INSERT INTO dbo.PromptVariants (PromptTemplateName, VariantKey, WeightBps, PromptBody, IsActive, CreatedUtc)
    VALUES (N'critic-system', N'baseline', 10000, NULL, 1, SYSUTCDATETIME());
