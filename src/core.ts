import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs';

/**
 * Check if file extension is .cs
 */
export function isCSharpFile(document: vscode.TextDocument) : boolean {
    // no need to check for language id becuase we are only registering for csharp files
    return document.fileName.endsWith('.cs')
}

/**
 * Find the csproj file for the given document
 * @param document 
 * @returns string | null
 */
export function findCsprojFile(document: vscode.TextDocument) : string | null {
    let _csprojFilePath = null;
    const _workspaceFolderPath = vscode.workspace.getWorkspaceFolder(document.uri)?.uri.path
    if(_workspaceFolderPath) {
        // looking for csproj file in workspace folder
        _csprojFilePath = fs.readdirSync(_workspaceFolderPath).find(f => /.\.csproj$/.test(f))
        // if csproj file is found, return full path
        if(_csprojFilePath) {
            _csprojFilePath = path.join(_workspaceFolderPath, _csprojFilePath)
        }
    }
    // either workspace folder does not exist or csproj file is not found in workspace folder
    if(!_csprojFilePath) {
        // deep search from document folder to root folder
        const {dir, root} = path.parse(document.fileName)
        let _searchDir = dir
        while(_searchDir !== root) {
            _csprojFilePath = fs.readdirSync(_searchDir).find(f => /.\.csproj$/.test(f));
            if (_csprojFilePath) {
                // csproj file found in current search dir
                _csprojFilePath = path.join(_searchDir, _csprojFilePath)
                break
            }
            // move to parent folder and search again
            _searchDir = path.join(_searchDir, '..')
        }
    }
    return _csprojFilePath ?? null;
}

/**
 * find namespace from csproj file either from RootNamespace or csproj file name
 * @param csprojFilePath path to .csproj file
 * @returns string | null
 */
export async function findNamespace(csprojFilePath: string, document: vscode.TextDocument) : Promise<string> {
    var _namespace = null;
    // find namespace from csproj file RootNamespace property
    _namespace = await findValueInCsproj(csprojFilePath, 'RootNamespace');
    // if RootNamespace is not found then use csproj file name
    if(!_namespace) {
        _namespace = path.basename(csprojFilePath, path.extname(csprojFilePath));
    }
    
    // normalize namespace name
    return normalizeNamespace(_namespace, path.relative(path.dirname(csprojFilePath), path.dirname(document.fileName)));
}

/**
 * Convert filename to PascalCase and replace spaces and dashes with underscores
 * @param document
 * @returns string
 */
export function getClassName(document: vscode.TextDocument) {
    let filename = path.basename(document.fileName, path.extname(document.fileName))
    return filename
        .replace(/^[a-z]/, s => s.toUpperCase())
        .replace(/[- ]/g, '_')
}

/**
 * Check if CSharp language version is 10 or higher to support file-scoped namespaces
 * @param csprojFilePath path to .csproj file
 * @returns boolean
 */
export async function isFileScopedNamespaceSupported(csprojFilePath: string) : Promise<boolean> {
    const langVersion = await findValueInCsproj(csprojFilePath, 'LangVersion')

    // if user has specified LangVersion then check if it is greater than 10
    if(langVersion) {
        return langVersion == 'latest' || langVersion == 'preview' || Number.parseFloat(langVersion) >= 10
    }

    // if user has not specified LangVersion then check if TargetFramework is greater than net6.0
    const targetFramework = await findValueInCsproj(csprojFilePath, 'TargetFramework')
    if(targetFramework) {
        return targetFramework.startsWith('net6') || targetFramework.startsWith('net7')
    }

    // if project has multiple target frameworks then check if any of them is greater than net6.0
    // in this case user must have specified LangVersion for better support
    const targetFrameworks = await findValueInCsproj(csprojFilePath, 'TargetFrameworks')
    if(targetFrameworks) {
        return targetFrameworks.split(';').some(f => f.startsWith('net6') || f.startsWith('net7'))
    }

    // nothing found so assume that file scoped namespace is not supported
    return false
}

/**
 * generate snippet text for given namespace, class name and class type
 * @param namespaceName namespace name
 * @param className class name
 * @param classType class type either: class, struct, enum, interface
 * @param useFileScopedNamespace use file scoped namespace
 * @returns string
 */
export function generateClassSnippetText(namespaceName: string, className: string, classType: string, useFileScopedNamespace: boolean) {
    let _snippetText = '';
    const _indent = useFileScopedNamespace ? '' : '\t';
    
    _snippetText += `namespace ${namespaceName}`;

    if(useFileScopedNamespace) {
        _snippetText += `;\n\n`;
    } else {
        _snippetText += `\n{\n`;
    }

    _snippetText += `${_indent}public ${classType} ${className}\n${_indent}{\n${_indent}\t$0\n${_indent}}\n`;

    if(!useFileScopedNamespace) {
        _snippetText += `}`;
    }

    return _snippetText;
}

/**
 * generate vs code snippet completion item
 * @param label snippet label
 * @param insertText snippet insert text
 * @param documentation snippet documentation
 * @param preselect preselect snippet while user types
 * @returns vscode.CompletionItem
 */
export function generateCompletionItem(label: string, insertText: string, documentation: string, kind: vscode.CompletionItemKind, preselect: boolean) {
    const _completionItem = new vscode.CompletionItem(label, kind);
    _completionItem.insertText = new vscode.SnippetString(insertText);
    _completionItem.detail = insertText;
    _completionItem.documentation = new vscode.MarkdownString(documentation);
    _completionItem.preselect = preselect;
    return _completionItem;
}


/**
 * Read csproj file and find value for given property
 * @param csprojFilePath path to .csproj file
 * @param key xml key
 * @returns string | null
 */
async function findValueInCsproj(csprojFilePath: string, key: string) : Promise<string | null> {
    const csproj = await vscode.workspace.openTextDocument(csprojFilePath);
    // const matches = csproj.getText().match(/</ + key +/>([\w.]+)<\// + key +/>/);
    const matches = csproj.getText().match(new RegExp(`<${key}>([\\w.]+)</${key}>`));
    if (matches) {
        return matches[1];
    }
    return null;
}

/**
 * normalize namespace name by replace spaces and dashes with underscore
 * @param namespace namespace name
 * @param projectRootRelativePath relative path from csproj file to document file
 * @returns string
 */
export function normalizeNamespace(namespace: string, projectRootRelativePath: string) {
    return path.join(namespace, projectRootRelativePath)
        .replace(/[\/\\]/g, '.')
        .replace(/[^\w.]/g, '_')
        .replace(/[.]{2,}/g, '.')
        .replace(/^[.]+/, '')
        .replace(/[.]+$/, '')
        .split('.')
        .map(s => /^[0-9]/.test(s) ? '_' + s : s)
        .join('.');
}