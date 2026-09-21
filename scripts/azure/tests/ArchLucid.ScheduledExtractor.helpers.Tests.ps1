#Requires -Version 7.0
# Run: Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.ScheduledExtractor.helpers.Tests.ps1'
Set-StrictMode -Version Latest

Describe "ArchLucid.ScheduledExtractor.helpers.ps1" {

    BeforeAll {
        [string]$script:helpersPath =
            Join-Path (Split-Path -Parent $PSScriptRoot) "ArchLucid.ScheduledExtractor.helpers.ps1"

        . $script:helpersPath

        function Get-AzContext { return $null }
        function Connect-AzAccount { }
        function Get-AzAccessToken { }
        function Invoke-WebRequest { }
        function Invoke-RestMethod { }

        function Get-ArchLucidHttpAuthHeadersHashtable
        {
            param(
                [string] $BearerToken = "",
                [string] $ApiKey = ""
            )

            [hashtable]$headers = @{}

            if (-not [string]::IsNullOrWhiteSpace($ApiKey))
            {
                $headers["X-Api-Key"] = $ApiKey.Trim()
            }

            if (-not [string]::IsNullOrWhiteSpace($BearerToken))
            {
                $headers["Authorization"] = "Bearer $($BearerToken.Trim())"
            }

            return $headers
        }

        function Merge-ArchLucidHttpScopeHeaders
        {
            param(
                [hashtable] $Headers,
                [string] $TenantId = "",
                [string] $WorkspaceId = "",
                [string] $ProjectId = ""
            )

            [hashtable]$merged = @{}

            if ($null -ne $Headers)
            {
                foreach ($key in $Headers.Keys)
                {
                    $merged[$key] = $Headers[$key]
                }
            }

            if (-not [string]::IsNullOrWhiteSpace($TenantId))
            {
                $merged["X-Tenant-Id"] = $TenantId.Trim()
            }

            if (-not [string]::IsNullOrWhiteSpace($WorkspaceId))
            {
                $merged["X-Workspace-Id"] = $WorkspaceId.Trim()
            }

            if (-not [string]::IsNullOrWhiteSpace($ProjectId))
            {
                $merged["X-Project-Id"] = $ProjectId.Trim()
            }

            return $merged
        }
    }

    It "rejects a blank API base URL" {
        { Resolve-ArchLucidScheduledExtractorApiBaseUri -ApiBaseUrl "   " } | Should -Throw "*required*"
    }

    It "trims trailing slashes from the API base URL" {
        Resolve-ArchLucidScheduledExtractorApiBaseUri -ApiBaseUrl "https://api.example.com/" |
            Should -Be "https://api.example.com"
    }

    It "appends runId as a query string when present" {
        [string]$uri = Get-ArchLucidScheduledExtractorUploadUri `
            -ApiBaseUrl "https://api.example.com/" `
            -RunId "run 1"

        $uri | Should -Be "https://api.example.com/v1/azure-extractor/upload?runId=run%201"
    }

    It "omits runId when it is blank" {
        [string]$uri = Get-ArchLucidScheduledExtractorUploadUri `
            -ApiBaseUrl "https://api.example.com" `
            -RunId "  "

        $uri | Should -Be "https://api.example.com/v1/azure-extractor/upload"
    }

    It "converts a SecureString access token to plaintext" {
        [securestring]$secure = ConvertTo-SecureString "vault-token" -AsPlainText -Force

        Convert-ArchLucidScheduledExtractorAccessTokenToPlaintext -Token $secure | Should -Be "vault-token"
    }

    It "returns an empty string for a null access token" {
        Convert-ArchLucidScheduledExtractorAccessTokenToPlaintext -Token $null | Should -Be ""
    }

    It "trims a string access token from Az.Accounts 4" {
        Convert-ArchLucidScheduledExtractorAccessTokenToPlaintext -Token "  raw-token  " | Should -Be "raw-token"
    }

    It "builds upload headers with API key and tenant scope" {
        Mock Import-ArchLucidScheduledExtractorAuthHeaders { }

        [hashtable]$headers = New-ArchLucidScheduledExtractorUploadHeaders `
            -ApiKey "test-key" `
            -TenantId "11111111-1111-1111-1111-111111111111" `
            -WorkspaceId "22222222-2222-2222-2222-222222222222"

        $headers["X-Api-Key"] | Should -Be "test-key"
        $headers["X-Tenant-Id"] | Should -Be "11111111-1111-1111-1111-111111111111"
        $headers["X-Workspace-Id"] | Should -Be "22222222-2222-2222-2222-222222222222"
    }

    It "throws when neither API key nor bearer token is present" {
        Mock Import-ArchLucidScheduledExtractorAuthHeaders { }

        { New-ArchLucidScheduledExtractorUploadHeaders -ApiKey "" -BearerToken "" } |
            Should -Throw "*API key or bearer token*"
    }

    It "uploads a package with Invoke-WebRequest form payload" {
        Mock Import-ArchLucidScheduledExtractorAuthHeaders { }
        Mock Invoke-WebRequest {
            return [PSCustomObject]@{
                StatusCode = 202
                Content    = '{"packageId":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"}'
            }
        }

        [string]$tempPackage = Join-Path ([System.IO.Path]::GetTempPath()) ("archlucid-scheduled-extractor-test-{0}.zip" -f [guid]::NewGuid().ToString("N"))

        try
        {
            Set-Content -LiteralPath $tempPackage -Value "zip-bytes" -Encoding ascii

            [object]$response = Send-ArchLucidAzureExtractorPackageFromPath `
                -PackagePath $tempPackage `
                -ApiBaseUrl "https://api.example.com" `
                -ApiKey "test-key" `
                -RunId "run-1"

            [int]$response.StatusCode | Should -Be 202
            Should -Invoke Invoke-WebRequest -Times 1
        }
        finally
        {
            Remove-Item -LiteralPath $tempPackage -Force -ErrorAction SilentlyContinue
        }
    }

    It "throws when upload returns a non-success status" {
        Mock Import-ArchLucidScheduledExtractorAuthHeaders { }
        Mock Invoke-WebRequest {
            return [PSCustomObject]@{
                StatusCode = 422
                Content    = "schema rejected"
            }
        }

        [string]$tempPackage = Join-Path ([System.IO.Path]::GetTempPath()) ("archlucid-scheduled-extractor-fail-{0}.zip" -f [guid]::NewGuid().ToString("N"))

        try
        {
            Set-Content -LiteralPath $tempPackage -Value "zip-bytes" -Encoding ascii

            { Send-ArchLucidAzureExtractorPackageFromPath `
                -PackagePath $tempPackage `
                -ApiBaseUrl "https://api.example.com" `
                -ApiKey "test-key" } | Should -Throw "*HTTP 422*"
        }
        finally
        {
            Remove-Item -LiteralPath $tempPackage -Force -ErrorAction SilentlyContinue
        }
    }

    It "skips Connect-AzAccount when a context already exists" {
        Mock Get-AzContext {
            return [PSCustomObject]@{
                Account = [PSCustomObject]@{ Id = "mi" }
            }
        }
        Mock Connect-AzAccount { throw "Connect-AzAccount should not run when a context exists." }

        Connect-ArchLucidScheduledExtractorManagedIdentity

        Should -Not -Invoke Connect-AzAccount
    }

    It "connects with managed identity when no Azure context exists" {
        Mock Get-AzContext { return $null }
        Mock Connect-AzAccount { }

        Connect-ArchLucidScheduledExtractorManagedIdentity -ClientId "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"

        Should -Invoke Connect-AzAccount -Times 1
    }

    It "resolves the collector script next to the helpers when the path is omitted" {
        [string]$resolved = Get-ArchLucidScheduledExtractorCollectorScriptPath -CollectorScriptPath ""

        $resolved | Should -Match "Get-ArchLucidAzurePackage\.ps1$"
        Test-Path -LiteralPath $resolved | Should -Be $true
    }

    It "invokes the collector with subscription and include-cost switches" {
        [string]$collector = Join-Path ([System.IO.Path]::GetTempPath()) ("fake-collector-{0}.ps1" -f [guid]::NewGuid().ToString("N"))
        [string]$output = Join-Path ([System.IO.Path]::GetTempPath()) ("fake-out-{0}.zip" -f [guid]::NewGuid().ToString("N"))

        try
        {
            Set-Content -LiteralPath $collector -Value @'
param(
    [string] $SubscriptionId,
    [string] $OutputPath,
    [string] $TenantId = "",
    [switch] $IncludeCost,
    [switch] $IncludeRetailPrices,
    [switch] $DryRun
)

$record = [PSCustomObject]@{
    SubscriptionId = $SubscriptionId
    OutputPath = $OutputPath
    TenantId = $TenantId
    IncludeCost = [bool]$IncludeCost
    IncludeRetailPrices = [bool]$IncludeRetailPrices
    DryRun = [bool]$DryRun
}

$record | ConvertTo-Json | Set-Content -LiteralPath $OutputPath -Encoding utf8
'@

            Invoke-ArchLucidScheduledAzureExtractorCollection `
                -CollectorScriptPath $collector `
                -SubscriptionId "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" `
                -OutputPath $output `
                -TenantId "99999999-8888-7777-6666-555555555555" `
                -IncludeCost `
                -IncludeRetailPrices

            [object]$payload = Get-Content -LiteralPath $output -Raw | ConvertFrom-Json
            $payload.SubscriptionId | Should -Be "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
            $payload.IncludeCost | Should -Be $true
            $payload.IncludeRetailPrices | Should -Be $true
            $payload.TenantId | Should -Be "99999999-8888-7777-6666-555555555555"
        }
        finally
        {
            Remove-Item -LiteralPath $collector, $output -Force -ErrorAction SilentlyContinue
        }
    }

    It "reads ARCHLUCID_API_KEY when no explicit key is passed" {
        [string]$previous = $env:ARCHLUCID_API_KEY

        try
        {
            $env:ARCHLUCID_API_KEY = "env-key"

            Resolve-ArchLucidScheduledExtractorApiKey -ApiKey "" | Should -Be "env-key"
        }
        finally
        {
            if ($null -eq $previous)
            {
                Remove-Item Env:ARCHLUCID_API_KEY -ErrorAction SilentlyContinue
            }
            else
            {
                $env:ARCHLUCID_API_KEY = $previous
            }
        }
    }

    It "reads the API key from Key Vault when param and env are empty" {
        [string]$previous = $env:ARCHLUCID_API_KEY

        try
        {
            Remove-Item Env:ARCHLUCID_API_KEY -ErrorAction SilentlyContinue

            Mock Get-AzAccessToken {
                return [PSCustomObject]@{
                    Token = "kv-access-token"
                }
            }
            Mock Invoke-RestMethod {
                return [PSCustomObject]@{
                    value = "vault-api-key"
                }
            }

            Resolve-ArchLucidScheduledExtractorApiKey `
                -ApiKey "" `
                -KeyVaultName "kv-alext-test" `
                -KeyVaultSecretName "archlucid-api-key" |
                Should -Be "vault-api-key"

            Should -Invoke Invoke-RestMethod -Times 1
        }
        finally
        {
            if ($null -eq $previous)
            {
                Remove-Item Env:ARCHLUCID_API_KEY -ErrorAction SilentlyContinue
            }
            else
            {
                $env:ARCHLUCID_API_KEY = $previous
            }
        }
    }
}
