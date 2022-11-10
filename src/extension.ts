import * as vscode from 'vscode';
import * as path from 'path';

import { findCsprojFile, findNamespace, toClassName, normalizeNamespace } from './core';

export function activate(context: vscode.ExtensionContext) {
	const completionProvider = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'csharp' }, {
		async provideCompletionItems(document, position, token, context) {
			const namespace : string | null = await getNamespace(document);
			if(!namespace) {
				return;
			}
			const className = getClassName(document);
			var snippets = createSnippetsCompletions(namespace, className);

			return snippets;
		}
	});
	context.subscriptions.push(completionProvider);
}

async function getNamespace(document: vscode.TextDocument) {
	const csproj = findCsprojFile(document)
	const namespace : string | null = await findNamespace(csproj)
	if(!namespace) {
		return null;
	}
	const projectRootRelativePath = path.relative(vscode.workspace.getWorkspaceFolder(document.uri)?.uri.path?? '', path.dirname(document.fileName))
	return normalizeNamespace(namespace, projectRootRelativePath) ?? null
}

function getClassName(document: vscode.TextDocument) {
	const fileName = path.basename(document.fileName, path.extname(document.fileName))
	const className = toClassName(fileName)
	return className
}


function createSnippetsCompletions(namespace: string, className: String) {
	const classCompletion = new vscode.CompletionItem('class', vscode.CompletionItemKind.Snippet);
	classCompletion.insertText = new vscode.SnippetString(
	`namespace ${namespace};\n\n` +
	`public class ${className}\n` +
	`{\n` +
	`\t$0\n` +
	`}`
	);
	classCompletion.documentation = new vscode.MarkdownString('Creates a new class with namespace');
	classCompletion.preselect = true;


	const interfaceCompletion = new vscode.CompletionItem('interface', vscode.CompletionItemKind.Snippet);
	interfaceCompletion.insertText = new vscode.SnippetString(
	`namespace ${namespace};\n\n` +
	`public interface ${className}\n` +
	`{\n` +
	`\t$0\n` +
	`}`
	);
	interfaceCompletion.documentation = new vscode.MarkdownString('Creates a new interface with namespace');
	interfaceCompletion.preselect = true;

	const enumCompletion = new vscode.CompletionItem('enum', vscode.CompletionItemKind.Snippet);
	enumCompletion.insertText = new vscode.SnippetString(
	`namespace ${namespace};\n\n` +
	`public enum ${className}\n` +
	`{\n` +
	`\t$0\n` +
	`}`
	);
	enumCompletion.documentation = new vscode.MarkdownString('Creates a new enum with namespace');
	enumCompletion.preselect = true;


	return [classCompletion, interfaceCompletion, enumCompletion];
}

// function createModulesCompletions(namespace: string) {
// 	const namespaceCompletion = new vscode.CompletionItem('namespace', vscode.CompletionItemKind.Module);
// 	namespaceCompletion.insertText = namespace;
// }

export function deactivate() { }
