using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ApplicationThrowIfNullCodemod;

/// <summary>
/// Replaces legacy primary-constructor validation (<c>_primaryConstructorArgumentValidation</c> +
/// <c>__ValidatePrimaryConstructorArguments</c>) with <c>private readonly _x = x ?? throw …</c> fields
/// and rewrites instance bodies to use those fields.
/// </summary>
internal sealed class PrimaryConstructorValidationMigrator(SemanticModel semanticModel)
{
    private readonly SemanticModel _semanticModel = semanticModel;

    internal CompilationUnitSyntax MigrateCompilationUnit(CompilationUnitSyntax root)
    {
        PrimaryCtorMigrationRewriter rewriter = new(_semanticModel);

        return (CompilationUnitSyntax)(rewriter.Visit(root) ?? root)!;
    }

    private sealed class PrimaryCtorMigrationRewriter : CSharpSyntaxRewriter
    {
        private readonly SemanticModel _semanticModel;

        internal PrimaryCtorMigrationRewriter(SemanticModel semanticModel)
        {
            _semanticModel = semanticModel;
        }

        public override SyntaxNode? VisitClassDeclaration(ClassDeclarationSyntax node)
        {
            ClassDeclarationSyntax visited =
                (ClassDeclarationSyntax)(base.VisitClassDeclaration(node) ?? node)!;

            return MigrateClassWithPrimaryConstructor(visited);
        }

        public override SyntaxNode? VisitRecordDeclaration(RecordDeclarationSyntax node)
        {
            if (node.ClassOrStructKeyword.IsKind(SyntaxKind.StructKeyword))
                return base.VisitRecordDeclaration(node);

            RecordDeclarationSyntax visited =
                (RecordDeclarationSyntax)(base.VisitRecordDeclaration(node) ?? node)!;

            return MigrateRecordWithLegacyPrimaryConstructorValidation(visited);
        }

        private RecordDeclarationSyntax MigrateRecordWithLegacyPrimaryConstructorValidation(RecordDeclarationSyntax visited)
        {
            ParameterListSyntax? plist = visited.ParameterList;

            MethodDeclarationSyntax? validator =
                visited.Members.OfType<MethodDeclarationSyntax>()
                    .FirstOrDefault(static m =>
                        string.Equals(m.Identifier.Text,
                            "__ValidatePrimaryConstructorArguments",
                            StringComparison.Ordinal));

            FieldDeclarationSyntax? legacyField =
                visited.Members.OfType<FieldDeclarationSyntax>()
                    .FirstOrDefault(IsLegacyPrimaryConstructorValidationField);

            if (validator is null && legacyField is null)
                return visited;

            SyntaxList<MemberDeclarationSyntax> strippedMembers =
                SyntaxFactory.List(
                    visited.Members.Where(m =>
                        !ReferenceEquals(m, legacyField) && !ReferenceEquals(m, validator)));

            ImmutableHashSet<string> guardedRecordProperties =
                validator is not null && plist is not null &&
                validator.ParameterList.Parameters.Count == plist.Parameters.Count
                    ? ExtractThrowIfNullMappedToPrimaryRecordProperties(validator, plist)
                    : ImmutableHashSet<string>.Empty;

            RecordDeclarationSyntax shell =
                EnsureRecordHasBraces(visited).WithMembers(strippedMembers);

            if (plist is null || plist.Parameters.Count is 0 || guardedRecordProperties.Count is 0)
                return shell;

            return ConvertValidatedPositionalRecord(shell, plist, guardedRecordProperties);
        }

        private static ImmutableHashSet<string> ExtractThrowIfNullMappedToPrimaryRecordProperties(
            MethodDeclarationSyntax validator,
            ParameterListSyntax plist)
        {
            ImmutableArray<ParameterSyntax> vParams =
                validator.ParameterList.Parameters.ToImmutableArray();
            ImmutableArray<ParameterSyntax> primaryParams =
                plist.Parameters.ToImmutableArray();

            if (vParams.Length != primaryParams.Length)
                return ImmutableHashSet<string>.Empty;

            ImmutableHashSet<string>.Builder builder =
                ImmutableHashSet.CreateBuilder(StringComparer.Ordinal);

            ImmutableArray<string> vNames =
                vParams.Select(static p => p.Identifier.ValueText).ToImmutableArray();

            if (validator.Body is null)
                return builder.ToImmutable();

            foreach (StatementSyntax stmt in validator.Body.Statements)
            {
                if (stmt is not ExpressionStatementSyntax { Expression: InvocationExpressionSyntax inv })
                    continue;

                if (!IsArgumentNullThrowIfNull(inv, out string argName))
                    continue;

                int idx = -1;

                for (int i = 0; i < vNames.Length; i++)
                {
                    if (string.Equals(vNames[i], argName, StringComparison.Ordinal))
                    {
                        idx = i;
                        break;
                    }
                }

                if (idx < 0 || idx >= primaryParams.Length)
                    continue;

                builder.Add(primaryParams[idx].Identifier.ValueText);
            }

            return builder.ToImmutable();
        }

        private static RecordDeclarationSyntax EnsureRecordHasBraces(RecordDeclarationSyntax recordDeclaration)
        {
            if (!recordDeclaration.OpenBraceToken.IsKind(SyntaxKind.None))
                return recordDeclaration;

            if (!recordDeclaration.SemicolonToken.IsKind(SyntaxKind.SemicolonToken))
                return recordDeclaration;

            SyntaxTriviaList trailing =
                recordDeclaration.SemicolonToken.TrailingTrivia;
            SyntaxToken closingBrace =
                SyntaxFactory.Token(SyntaxKind.CloseBraceToken).WithTrailingTrivia(trailing);

            return recordDeclaration
                .WithSemicolonToken(default)
                .WithOpenBraceToken(SyntaxFactory.Token(SyntaxKind.OpenBraceToken))
                .WithCloseBraceToken(closingBrace);
        }

        private static RecordDeclarationSyntax ConvertValidatedPositionalRecord(
            RecordDeclarationSyntax visited,
            ParameterListSyntax plist,
            ImmutableHashSet<string> guardedPropertyNames)
        {
            bool needsJsonCtor =
                visited.BaseList?.Types.Any(static t =>
                    t.Type.ToString().EndsWith("BackgroundJobWorkUnit", StringComparison.Ordinal)) ==
                true;

            List<string> lines = [];

            foreach (ParameterSyntax p in plist.Parameters)
            {
                TypeSyntax typeSyntax = p.Type ??
                                        SyntaxFactory.PredefinedType(
                                            SyntaxFactory.Token(SyntaxKind.ObjectKeyword));

                lines.Add(
                    $"public {typeSyntax.ToFullString().Trim()} {p.Identifier.ValueText} {{ get; init; }}");
            }

            List<string> ctorParamParts = [];
            List<string> ctorBodyLines = [];

            foreach (ParameterSyntax p in plist.Parameters)
            {
                TypeSyntax typeSyntax = p.Type ??
                                        SyntaxFactory.PredefinedType(
                                            SyntaxFactory.Token(SyntaxKind.ObjectKeyword));

                string prop = p.Identifier.ValueText;
                string camel = ToCamelCaseIdentifier(prop);
                ctorParamParts.Add($"{typeSyntax.ToFullString().Trim()} {camel}");

                ctorBodyLines.Add(
                    guardedPropertyNames.Contains(prop)
                        ? $"{prop} = {camel} ?? throw new ArgumentNullException(nameof({camel}));"
                        : $"{prop} = {camel};");
            }

            if (needsJsonCtor)
                lines.Add("[global::System.Text.Json.Serialization.JsonConstructor]");

            lines.Add(
                $"public {visited.Identifier.ValueText}({string.Join(", ", ctorParamParts)})");

            lines.Add("{");
            lines.AddRange(ctorBodyLines);
            lines.Add("}");

            MemberDeclarationSyntax[] generated =
                ParseMembers(string.Join(Environment.NewLine, lines));

            SyntaxList<MemberDeclarationSyntax> merged =
                SyntaxFactory.List(generated.Concat(visited.Members));

            return visited
                .WithParameterList(null)
                .WithMembers(merged);
        }

        private static string ToCamelCaseIdentifier(string identifier)
        {
            if (identifier.Length is 0)
                return identifier;

            if (!char.IsUpper(identifier[0]))
                return identifier;

            return char.ToLowerInvariant(identifier[0]) + identifier.Substring(1);
        }

        private ClassDeclarationSyntax MigrateClassWithPrimaryConstructor(ClassDeclarationSyntax visited)
        {
            ParameterListSyntax? plist = visited.ParameterList;
            if (plist is null || plist.Parameters.Count is 0)
                return visited;

            MethodDeclarationSyntax? validator =
                visited.Members.OfType<MethodDeclarationSyntax>()
                    .FirstOrDefault(static m =>
                        string.Equals(m.Identifier.Text,
                            "__ValidatePrimaryConstructorArguments",
                            StringComparison.Ordinal));

            FieldDeclarationSyntax? legacyField =
                visited.Members.OfType<FieldDeclarationSyntax>()
                    .FirstOrDefault(IsLegacyPrimaryConstructorValidationField);

            if (validator is null && legacyField is null)
                return visited;

            ImmutableHashSet<string> guarded =
                validator is not null
                    ? ExtractThrowIfNullParameterNames(validator)
                    : ImmutableHashSet<string>.Empty;

            INamedTypeSymbol? typeSymbol = _semanticModel.GetDeclaredSymbol(visited);
            IMethodSymbol? primaryCtorSymbol =
                typeSymbol?.InstanceConstructors.FirstOrDefault(c =>
                    c.Parameters.Length == plist.Parameters.Count &&
                    ParametersAlignWithSyntax(c.Parameters, plist));

            visited = RemoveLegacyValidationMembers(visited, legacyField, validator);

            ImmutableArray<string> namesNeedingFields =
                guarded.Count > 0
                    ? guarded.ToImmutableArray()
                    : CollectNonNullableReferenceParameterNames(plist);

            HashSet<string> parametersWithBackingFields = [];

            foreach (string paramName in namesNeedingFields)
            {
                ParameterSyntax? ps =
                    plist.Parameters.FirstOrDefault(p => p.Identifier.ValueText == paramName);
                if (ps is null)
                    continue;

                IParameterSymbol? pSym = _semanticModel.GetDeclaredSymbol(ps);
                if (pSym is null || !RequiresNonNullableReferenceThrowIfNull(pSym))
                    continue;

                string fieldName = UnderscorePrefix(paramName);
                if (HasExistingNullGuardBackingField(visited, paramName, fieldName))
                {
                    parametersWithBackingFields.Add(paramName);
                    continue;
                }

                bool fieldNameTaken =
                    visited.Members.OfType<FieldDeclarationSyntax>()
                        .SelectMany(static f => f.Declaration.Variables)
                        .Any(v =>
                            string.Equals(v.Identifier.ValueText, fieldName, StringComparison.Ordinal));

                if (fieldNameTaken)
                    continue;

                string typeSource =
                    (ps.Type?.ToFullString().Trim().Length ?? 0) > 0
                        ? ps.Type!.ToFullString().Trim()
                        : pSym.Type.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat);

                string decl =
                    $"private readonly {typeSource} {fieldName} = {paramName} ?? throw new ArgumentNullException(nameof({paramName}));";

                MemberDeclarationSyntax[] parsed = ParseMembers(decl);
                visited = visited.WithMembers(visited.Members.InsertRange(0, parsed));
                parametersWithBackingFields.Add(paramName);
            }

            if (primaryCtorSymbol is null || namesNeedingFields.Length is 0)
                return visited;

            ImmutableDictionary<string, string>.Builder replacementBuilder =
                ImmutableDictionary.CreateBuilder<string, string>();

            foreach (string paramName in namesNeedingFields)
            {
                if (!parametersWithBackingFields.Contains(paramName))
                    continue;

                ParameterSyntax? ps =
                    plist.Parameters.FirstOrDefault(p => p.Identifier.ValueText == paramName);
                if (ps is null)
                    continue;

                IParameterSymbol? pSym = _semanticModel.GetDeclaredSymbol(ps);
                if (pSym is null || !RequiresNonNullableReferenceThrowIfNull(pSym))
                    continue;

                replacementBuilder[paramName] = UnderscorePrefix(paramName);
            }

            ImmutableDictionary<string, string> replacement = replacementBuilder.ToImmutable();
            if (replacement.Count is 0)
                return visited;

            ReplacePrimaryCtorParameterUsesRewriter replacer =
                new(_semanticModel, visited, primaryCtorSymbol, replacement);

            return (ClassDeclarationSyntax)(replacer.Visit(visited) ?? visited)!;
        }

        private ImmutableArray<string> CollectNonNullableReferenceParameterNames(ParameterListSyntax plist)
        {
            ImmutableArray<string>.Builder builder = ImmutableArray.CreateBuilder<string>();

            foreach (ParameterSyntax ps in plist.Parameters)
            {
                IParameterSymbol? pSym = _semanticModel.GetDeclaredSymbol(ps);
                if (pSym is not null && RequiresNonNullableReferenceThrowIfNull(pSym))
                    builder.Add(ps.Identifier.ValueText);
            }

            return builder.ToImmutable();
        }

        private static ClassDeclarationSyntax RemoveLegacyValidationMembers(
            ClassDeclarationSyntax visited,
            FieldDeclarationSyntax? legacyField,
            MethodDeclarationSyntax? validator)
        {
            IEnumerable<MemberDeclarationSyntax> kept =
                visited.Members.Where(m =>
                    !ReferenceEquals(m, legacyField) && !ReferenceEquals(m, validator));

            return visited.WithMembers(SyntaxFactory.List(kept));
        }

        private static MemberDeclarationSyntax[] ParseMembers(string memberText)
        {
            string wrapped = "class __Tmp { " + memberText + " }";
            CompilationUnitSyntax unit =
                CSharpSyntaxTree.ParseText(
                        wrapped,
                        CSharpParseOptions.Default.WithLanguageVersion(LanguageVersion.Preview))
                    .GetCompilationUnitRoot();
            ClassDeclarationSyntax tmp =
                unit.DescendantNodes().OfType<ClassDeclarationSyntax>().First();

            return tmp.Members.ToArray();
        }

        private static bool IsLegacyPrimaryConstructorValidationField(FieldDeclarationSyntax field)
        {
            foreach (VariableDeclaratorSyntax v in field.Declaration.Variables)
            {
                string name = v.Identifier.ValueText;
                if (!name.EndsWith("primaryConstructorArgumentValidation", StringComparison.Ordinal))
                    continue;

                if (v.Initializer?.Value is InvocationExpressionSyntax inv &&
                    inv.Expression is IdentifierNameSyntax id &&
                    string.Equals(id.Identifier.Text,
                        "__ValidatePrimaryConstructorArguments",
                        StringComparison.Ordinal))
                    return true;
            }

            return false;
        }

        private static ImmutableHashSet<string> ExtractThrowIfNullParameterNames(
            MethodDeclarationSyntax validator)
        {
            ImmutableHashSet<string>.Builder builder =
                ImmutableHashSet.CreateBuilder(StringComparer.Ordinal);

            if (validator.Body is null)
                return builder.ToImmutable();

            foreach (StatementSyntax stmt in validator.Body.Statements)
            {
                if (stmt is not ExpressionStatementSyntax { Expression: InvocationExpressionSyntax inv })
                    continue;

                if (!IsArgumentNullThrowIfNull(inv, out string argName))
                    continue;

                builder.Add(argName);
            }

            return builder.ToImmutable();
        }

        private static bool IsArgumentNullThrowIfNull(
            InvocationExpressionSyntax inv,
            out string argName)
        {
            argName = string.Empty;

            if (inv.Expression is not MemberAccessExpressionSyntax memberAccess)
                return false;

            if (memberAccess.Expression is not IdentifierNameSyntax typeName ||
                !string.Equals(typeName.Identifier.Text, nameof(ArgumentNullException),
                    StringComparison.Ordinal))
                return false;

            if (!string.Equals(memberAccess.Name.Identifier.Text,
                    nameof(ArgumentNullException.ThrowIfNull), StringComparison.Ordinal))
                return false;

            if (inv.ArgumentList.Arguments.Count is 0)
                return false;

            if (inv.ArgumentList.Arguments[0].Expression is not IdentifierNameSyntax id)
                return false;

            argName = id.Identifier.ValueText;
            return true;
        }

        private static bool ParametersAlignWithSyntax(
            ImmutableArray<IParameterSymbol> ctorParams,
            ParameterListSyntax plist)
        {
            if (ctorParams.Length != plist.Parameters.Count)
                return false;

            for (int i = 0; i < ctorParams.Length; i++)
            {
                if (!string.Equals(ctorParams[i].Name,
                        plist.Parameters[i].Identifier.ValueText,
                        StringComparison.Ordinal))
                    return false;
            }

            return true;
        }

        private static bool HasExistingNullGuardBackingField(
            ClassDeclarationSyntax visited,
            string parameterName,
            string fieldName)
        {
            foreach (FieldDeclarationSyntax field in visited.Members.OfType<FieldDeclarationSyntax>())
            {
                foreach (VariableDeclaratorSyntax v in field.Declaration.Variables)
                {
                    if (!string.Equals(v.Identifier.ValueText, fieldName, StringComparison.Ordinal))
                        continue;

                    if (v.Initializer?.Value is not BinaryExpressionSyntax coalesce ||
                        !coalesce.IsKind(SyntaxKind.CoalesceExpression))
                        continue;

                    if (coalesce.Left is not IdentifierNameSyntax left ||
                        !string.Equals(left.Identifier.ValueText, parameterName, StringComparison.Ordinal))
                        continue;

                    return IsThrowArgumentNullException(coalesce.Right);
                }
            }

            return false;
        }

        private static bool IsThrowArgumentNullException(ExpressionSyntax expr)
        {
            ExpressionSyntax e = expr;
            while (e is ParenthesizedExpressionSyntax p)
                e = p.Expression;

            if (e is ThrowExpressionSyntax throwExpr)
                e = throwExpr.Expression;

            return e is ObjectCreationExpressionSyntax obj &&
                   obj.Type is IdentifierNameSyntax id &&
                   string.Equals(id.Identifier.Text, nameof(ArgumentNullException),
                       StringComparison.Ordinal);
        }

        private static string UnderscorePrefix(string camelCaseParameterName) =>
            "_" + camelCaseParameterName;

        private static bool RequiresNonNullableReferenceThrowIfNull(IParameterSymbol p)
        {
            if (p.RefKind == RefKind.Out)
                return false;

            if (p.NullableAnnotation != NullableAnnotation.NotAnnotated)
                return false;

            ITypeSymbol t = p.Type;

            return t switch
            {
                ITypeParameterSymbol tp =>
                    tp.HasReferenceTypeConstraint,
                _ =>
                    t.IsReferenceType,
            };
        }

        private sealed class ReplacePrimaryCtorParameterUsesRewriter(
            SemanticModel semanticModel,
            ClassDeclarationSyntax containingType,
            IMethodSymbol primaryCtorSymbol,
            ImmutableDictionary<string, string> paramToField) : CSharpSyntaxRewriter
        {
            private readonly SemanticModel _semanticModel = semanticModel;
            private readonly ClassDeclarationSyntax _containingType = containingType;
            private readonly IMethodSymbol _primaryCtorSymbol = primaryCtorSymbol;
            private readonly ImmutableDictionary<string, string> _paramToField = paramToField;

            public override SyntaxNode? VisitIdentifierName(IdentifierNameSyntax node)
            {
                if (!_paramToField.TryGetValue(node.Identifier.ValueText, out string? fieldName))
                    return base.VisitIdentifierName(node);

                if (IsInstanceFieldInitializerIdentifier(node))
                    return base.VisitIdentifierName(node);

                if (node.Parent is QualifiedNameSyntax)
                    return base.VisitIdentifierName(node);

                if (node.Parent is MemberAccessExpressionSyntax ma &&
                    ma.Name == node &&
                    ma.Expression is not ThisExpressionSyntax &&
                    ma.Expression is not BaseExpressionSyntax)
                    return base.VisitIdentifierName(node);

                if (IsNameOfTarget(node))
                    return base.VisitIdentifierName(node);

                if (!OccursInsideInstanceMemberOf(node, _containingType))
                    return base.VisitIdentifierName(node);

                SymbolInfo symbolInfo;

                try
                {
                    symbolInfo = _semanticModel.GetSymbolInfo(node);
                }
                catch (ArgumentException)
                {
                    return base.VisitIdentifierName(node);
                }

                if (symbolInfo.Symbol is not IParameterSymbol paramSym)
                    return base.VisitIdentifierName(node);

                if (!SymbolEqualityComparer.Default.Equals(paramSym.ContainingSymbol, _primaryCtorSymbol))
                    return base.VisitIdentifierName(node);

                return SyntaxFactory.IdentifierName(fieldName)
                    .WithTriviaFrom(node);
            }

            private static bool IsInstanceFieldInitializerIdentifier(IdentifierNameSyntax node)
            {
                SyntaxNode? walk = node.Parent;

                while (walk is not null)
                {
                    if (walk is EqualsValueClauseSyntax &&
                        walk.Parent is VariableDeclaratorSyntax &&
                        walk.Parent.Parent is VariableDeclarationSyntax vd &&
                        vd.Parent is FieldDeclarationSyntax fd)
                        return !fd.Modifiers.Any(SyntaxKind.StaticKeyword);

                    walk = walk.Parent;
                }

                return false;
            }

            private static bool IsNameOfTarget(IdentifierNameSyntax node)
            {
                SyntaxNode? current = node.Parent;
                while (current is QualifiedNameSyntax or AliasQualifiedNameSyntax or ParenthesizedExpressionSyntax)
                    current = current.Parent;

                return current is ArgumentSyntax { Parent: ArgumentListSyntax { Parent: InvocationExpressionSyntax inv } } &&
                       inv.Expression is IdentifierNameSyntax id &&
                       string.Equals(id.Identifier.Text, "nameof", StringComparison.Ordinal);
            }

            private static bool OccursInsideInstanceMemberOf(
                IdentifierNameSyntax node,
                ClassDeclarationSyntax containingType)
            {
                SyntaxNode? current = node.Parent;
                while (current is not null)
                {
                    if (ReferenceEquals(current, containingType))
                        return false;

                    if (current is MethodDeclarationSyntax method)
                        return !method.Modifiers.Any(SyntaxKind.StaticKeyword);

                    if (current is PropertyDeclarationSyntax property)
                        return !property.Modifiers.Any(SyntaxKind.StaticKeyword);

                    if (current is ConstructorDeclarationSyntax ctor)
                        return !ctor.Modifiers.Any(SyntaxKind.StaticKeyword);

                    if (current is OperatorDeclarationSyntax or ConversionOperatorDeclarationSyntax)
                        return false;

                    current = current.Parent;
                }

                return false;
            }
        }
    }
}
