import * as vscode from 'vscode';
import * as core from './core'

export function activate(context: vscode.ExtensionContext) {

	// get project configurations
	const config = vscode.workspace.getConfiguration("sharpSnippets");

	const completionProvider = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'csharp' }, {
		async provideCompletionItems(document, position, token, context) {

			const preferFileScopedNamespaceConfig = config.get<boolean>('preferFileScopedNamespaceConfig') ?? false;

			// check if file is not a script .csx
			if (!core.isCSharpFile(document)) {
				return;
			}

			// get csproj file path
			const csproj = core.findCsprojFile(document)
			if (!csproj) {
				// no csproj file found, show error message and return
				vscode.window.showErrorMessage('No csproj file found')
				return;
			}

			// check if workspace uses Directory.Packages.props file
			const directoryPackagesPropsFilePath = await core.findsDirectoryPackagesProps(document)

			// get namespace from csproj file
			const namespace: string = await core.findNamespace(csproj, document)

			// get class name from file name
			const className = core.getClassName(document)

			// check if file-scoped namespace is supported and user wants to use it
			const useFileScopedNamespace = await core.isFileScopedNamespaceSupported(csproj, directoryPackagesPropsFilePath) &&
				preferFileScopedNamespaceConfig

			// generate snippet text
			const classCompletionText = core.generateClassSnippetText(namespace, className, 'class', useFileScopedNamespace)
			const classCompletionItem = core.generateCompletionItem('class', classCompletionText, 'Generate class with namespace', vscode.CompletionItemKind.Snippet, true)

			const interfaceCompletionText = core.generateClassSnippetText(namespace, className, 'interface', useFileScopedNamespace)
			const interfaceCompletionItem = core.generateCompletionItem('interface', interfaceCompletionText, 'Generate interface with namespace', vscode.CompletionItemKind.Snippet, true)

			const enumCompletionText = core.generateClassSnippetText(namespace, className, 'enum', useFileScopedNamespace)
			const enumCompletionItem = core.generateCompletionItem('enum', enumCompletionText, 'Generate enum with namespace', vscode.CompletionItemKind.Snippet, true)

			const structompletionText = core.generateClassSnippetText(namespace, className, 'struct', useFileScopedNamespace)
			const structompletionItem = core.generateCompletionItem('struct', structompletionText, 'Generate enum with namespace', vscode.CompletionItemKind.Snippet, true)

			return [classCompletionItem, interfaceCompletionItem, enumCompletionItem, structompletionItem]
		}
	});
	context.subscriptions.push(completionProvider);
}


export function deactivate() { }
