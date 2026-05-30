#requires -Version 5.1
Set-StrictMode -Version Latest

Describe 'ApiIntegrationTestShardSupport' {
    BeforeAll {
        . (Join-Path (Split-Path $PSScriptRoot -Parent) 'ApiIntegrationTestShardSupport.ps1')
    }

    It 'parses dotnet test --list-tests lines into unique class names' {
        $lines = @(
            'The following Tests are available:',
            '    ArchLucid.Api.Tests.FooTests.Method_one',
            '    ArchLucid.Api.Tests.FooTests.Method_two',
            '    ArchLucid.Api.Tests.BarTests.Method_alpha'
        )

        $classes = ConvertFrom-DotNetTestListOutput -Lines $lines

        $classes | Should -Be @(
            'ArchLucid.Api.Tests.BarTests',
            'ArchLucid.Api.Tests.FooTests'
        )
    }

    It 'assigns classes round-robin across shards deterministically' {
        $all = @('A', 'B', 'C', 'D', 'E')

        Get-ApiIntegrationTestShardClassNames -AllClassNames $all -ShardIndex 0 -ShardCount 3 |
            Should -Be @('A', 'D')

        Get-ApiIntegrationTestShardClassNames -AllClassNames $all -ShardIndex 1 -ShardCount 3 |
            Should -Be @('B', 'E')

        Get-ApiIntegrationTestShardClassNames -AllClassNames $all -ShardIndex 2 -ShardCount 3 |
            Should -Be @('C')
    }

    It 'builds a combined Category and FullyQualifiedName filter' {
        $filter = New-ApiIntegrationTestClassFilter `
            -ClassNames @('ArchLucid.Api.Tests.FooTests') `
            -BaseFilter 'Category!=Slow&Category=Integration'

        $filter | Should -Be 'Category!=Slow&Category=Integration&(FullyQualifiedName~ArchLucid.Api.Tests.FooTests)'
    }
}
