import * as vscode from 'vscode';
import { sortOrder } from './order-concentric';

type SortingAlgorithm = (a: string, b: string) => number;

function sortActiveSelection(algorithm: SortingAlgorithm, removeDuplicateValues: boolean): Thenable<boolean> | undefined {
  const textEditor = vscode.window.activeTextEditor;
  const selection = textEditor.selection;
  if (selection.isSingleLine) {
    return undefined;
  }
  return sortConcentrically(textEditor, selection.start.line, selection.end.line, algorithm, removeDuplicateValues);
}

function sortConcentrically(textEditor: vscode.TextEditor, startLine: number, endLine: number, algorithm: SortingAlgorithm, removeDuplicateValues: boolean): Thenable<boolean> {
  const lines: string[] = [];
  for (let i = startLine; i <= endLine; i++) {
    lines.push(textEditor.document.lineAt(i).text);
  }

  // Remove blank lines in selection
  if (vscode.workspace.getConfiguration('sortConcentrically').get('filterBlankLines') === true) {
    removeBlanks(lines);
  }

  lines.sort(algorithm);

  if (removeDuplicateValues) {
    removeDuplicates(lines, algorithm);
  }

  return textEditor.edit(editBuilder => {
    const range = new vscode.Range(startLine, 0, endLine, textEditor.document.lineAt(endLine).text.length);
    editBuilder.replace(range, lines.join('\n'));
  });
}

function removeDuplicates(lines: string[], algorithm: SortingAlgorithm | undefined): void {
  for (let i = 1; i < lines.length; ++i) {
    if (algorithm ? algorithm(lines[i - 1], lines[i]) === 0 : lines[i - 1] === lines[i]) {
      lines.splice(i, 1);
      i--;
    }
  }
}

function removeBlanks(lines: string[]): void {
  for (let i = 0; i < lines.length; ++i) {
    if (lines[i].trim() === '') {
      lines.splice(i, 1);
      i--;
    }
  }
}

function concentric(a: string, b: string): number {
  const aProp = a.match(/^([^:]+)/)[0].trim();
  const bProp = b.match(/^([^:]+)/)[0].trim();

  // leave to end of array if not in sortOrder list
  if (sortOrder.indexOf(aProp) === -1 && sortOrder.indexOf(bProp) === -1) {
    // both are not in sortOrder array, so alphabetise them
    return aProp > bProp ? 1 : -1;
  } else if (sortOrder.indexOf(aProp) === -1) {
    // move down a
    return 1;
  } else if (sortOrder.indexOf(bProp) === -1) {
    // move down b
    return -1;
  }

  // both are in sortOrder array, so sort them normally
  return sortOrder.indexOf(aProp) - sortOrder.indexOf(bProp);
}

export const sortNormal = () => sortActiveSelection(concentric, false);