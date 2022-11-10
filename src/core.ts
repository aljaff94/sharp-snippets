import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function findCsprojFile(document: vscode.TextDocument) {
    let csproj: string | undefined
    const projectRootPath = vscode.workspace.getWorkspaceFolder(document.uri)?.uri.path
    if (projectRootPath) {
        csproj = fs.readdirSync(projectRootPath).find(f => /.\.csproj$/.test(f))
        if(csproj) {
            csproj = path.join(projectRootPath, csproj)
        }
    }
    if (!csproj) {
        let { dir, root } = path.parse(document.fileName)
        let searchDir = dir
        while (searchDir !== root) {
            csproj = fs.readdirSync(searchDir).find(f => /.\.csproj$/.test(f));
            if (csproj) {
                csproj = path.join(searchDir, csproj)
                break
            }
            searchDir = path.join(searchDir, '..')
        }
    }
    return csproj ?? null
}

export async function findNamespace(csprojPath: string | null) {
    if(!csprojPath) {
        return null
    }
    const csproj = await vscode.workspace.openTextDocument(csprojPath);
    const matches = csproj.getText().match(/<RootNamespace>([\w.]+)<\/RootNamespace>/);
    if (matches) {
        return matches[1];
    }
    return path.basename(csprojPath, path.extname(csprojPath));
}

export function toClassName(fileName: string) {
    return fileName
        .replace(/^[a-z]/, s => s.toUpperCase())
        .replace(/[- ]/g, '_')
}

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