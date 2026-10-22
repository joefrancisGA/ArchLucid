# Phase 6: rename ArchiForge-prefixed identifiers to ArchLucid (longest-first).
# Skips templates/, Generated/, and _docker_publish.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$pairs = @(
    'InMemoryArchiForgeUnitOfWorkFactory', 'InMemoryArchLucidUnitOfWorkFactory',
    'DapperArchiForgeUnitOfWorkFactory', 'DapperArchLucidUnitOfWorkFactory',
    'ArchiForgeStorageServiceCollectionExtensions', 'ArchLucidStorageServiceCollectionExtensions',
    'ArchiForgeAuthConfigurationBridge', 'ArchLucidAuthConfigurationBridge',
    'ArchiForgeRoleClaimsTransformation', 'ArchLucidRoleClaimsTransformation',
    'ArchiForgeConfigurationBridgeTests', 'ArchLucidConfigurationBridgeTests',
    'ArchiForgeAuthConfigurationBridgeTests', 'ArchLucidAuthConfigurationBridgeTests',
    'ArchiForgeConfigurationRulesTests', 'ArchLucidConfigurationRulesTests',
    'ArchiForgeAuthOptionsConfigurationTests', 'ArchLucidAuthOptionsConfigurationTests',
    'IArchiForgeUnitOfWorkFactory', 'IArchLucidUnitOfWorkFactory',
    'InMemoryArchiForgeUnitOfWork', 'InMemoryArchLucidUnitOfWork',
    'DapperArchiForgeUnitOfWork', 'DapperArchLucidUnitOfWork',
    'ArchiForgeSerilogConfiguration', 'ArchLucidSerilogConfiguration',
    'ArchiForgePersistenceStartup', 'ArchLucidPersistenceStartup',
    'ArchiForgeConfigurationRules', 'ArchLucidConfigurationRules',
    'ArchiForgeConfigurationBridge', 'ArchLucidConfigurationBridge',
    'ResolveArchiForgeOptions', 'ResolveArchLucidOptions',
    'ArchiForgeHostingRole', 'ArchLucidHostingRole',
    'AddArchiForgeGracefulShutdown', 'AddArchLucidGracefulShutdown',
    'AddArchiForgeOpenTelemetry', 'AddArchLucidOpenTelemetry',
    'AddArchiForgeApplicationServices', 'AddArchLucidApplicationServices',
    'UseArchiForgeWorkerPipeline', 'UseArchLucidWorkerPipeline',
    'GenerateArchiForgeOpenApiClient', 'GenerateArchLucidOpenApiClient',
    'IArchiForgeUnitOfWork', 'IArchLucidUnitOfWork',
    'ArchiForgeInstrumentation', 'ArchLucidInstrumentation',
    'ArchiForgeHttpHeaders', 'ArchLucidHttpHeaders',
    'ArchiForgePolicies', 'ArchLucidPolicies',
    'ArchiForgeRoles', 'ArchLucidRoles',
    'ArchiForgeAuthOptions', 'ArchLucidAuthOptions',
    'ArchiForgeOptions', 'ArchLucidOptions',
    'ArchiForgeProjectScaffolder', 'ArchLucidProjectScaffolder',
    'ArchiForgeApiClientPackageTests', 'ArchLucidApiClientPackageTests',
    'ArchiForgeApiClientPackage', 'ArchLucidApiClientPackage',
    'ArchiForgeApiClientBaseUrlTests', 'ArchLucidApiClientBaseUrlTests',
    'ArchiForgeApiClientHttpTests', 'ArchLucidApiClientHttpTests',
    'ArchiForgeApiClientTests', 'ArchLucidApiClientTests',
    'ArchiForgeApiClient', 'ArchLucidApiClient',
    'ArchiForgeApiFactory', 'ArchLucidApiFactory',
    'ArchiForgeConfigTests', 'ArchLucidConfigTests',
    'ArchiForgeWebhooks', 'ArchLucidWebhooks',
    'ArchiForgeStorageProvider', 'ArchLucidStorageProvider',
    'ArchiForgeAuthMode', 'ArchLucidAuthMode',
    'ArchiForge.ReleaseCandidate', 'ArchLucid.ReleaseCandidate'
)

function Test-SkipPath {
    param([string]$p)
    foreach ($x in @('\bin\', '\obj\', '\_docker_publish', '\artifacts-bench\', '\.git\', '\node_modules\', '\templates\', '\Generated\')) {
        if ($p -like "*$x*") {
            return $true
        }
    }

    return $false
}

$csFiles = Get-ChildItem -Path $root -Recurse -Filter '*.cs' -File | Where-Object { -not (Test-SkipPath $_.FullName) }

$updated = 0
foreach ($f in $csFiles) {
    $text = [System.IO.File]::ReadAllText($f.FullName)
    $orig = $text

    for ($i = 0; $i -lt $pairs.Count; $i += 2) {
        $text = $text.Replace($pairs[$i], $pairs[$i + 1])
    }

    # HTTP custom headers (contract surface).
    $text = $text.Replace('X-ArchiForge-', 'X-ArchLucid-')

    if ($text -ne $orig) {
        [System.IO.File]::WriteAllText($f.FullName, $text, [System.Text.UTF8Encoding]::new($false))
        $updated++
    }
}

Write-Host "Updated $updated .cs files"
