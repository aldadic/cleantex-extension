// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';

// Import the cleanString function from the clean module
import { cleanString } from './clean';

// This method is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {

	// Display a message to the user when the extension is activated
	console.log('CleanTeX is activated!');

	// Register the command to clean selected files in the file explorer
	let cleanFiles = vscode.commands.registerCommand('cleantex.cleanFiles', async (_contextSelection: vscode.Uri, allSelections: vscode.Uri[]) => {
		// get command name from configuration
		const commandName = vscode.workspace.getConfiguration('cleantex').get('command');
		const command = `\\${commandName}{`;

		// get makeBackup setting from configuration
		const makeBackup = vscode.workspace.getConfiguration('cleantex').get('makeBackup');

		// get the selected files
		let files = allSelections.map(async (uri) => {
			let document = await vscode.workspace.openTextDocument(uri);
			// if document is not a LaTeX file, skip cleaning and return 0
			if (document.languageId !== 'latex') {
				return 0;
			}
			// make a copy of the document named filename.old.fileextension if makeBackup is true
			if (makeBackup) {
				let oldUri = vscode.Uri.file(uri.fsPath + '.old' + uri.fsPath.substring(uri.fsPath.lastIndexOf('.')));
				await vscode.workspace.fs.writeFile(oldUri, Buffer.from(document.getText()));
			}
			// clean the document
			let input = document.getText();
			let [output, counter] = cleanString(input, command);
			await vscode.workspace.fs.writeFile(uri, Buffer.from(output));
			return counter;
		});

		// show a message to the user
		let counters = await Promise.all(files);
		let nonZero = counters.filter((val) => val > 0);
		let total = counters.reduce((acc, val) => acc + val, 0);
		let commandNameText = total === 1 ? commandName : commandName + 's';
		let filesText = nonZero.length === 1 ? 'file' : 'files';
		let message = total === 0 ? `No ${commandName}s found.` : `Removed ${total} ${commandNameText} in ${nonZero.length} ${filesText}.`;
		vscode.window.showInformationMessage(message);
	});

	// Register the command to clean the selected text
	let cleanSelection = vscode.commands.registerCommand('cleantex.cleanSelection', () => {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			if (editor.selection.isEmpty) {
				vscode.window.showErrorMessage('No text selected.');
				return;
			}
			else {
				let selection = editor.selection;
				let input = editor.document.getText(selection);
		
				// get command name from configuration
				const commandName = vscode.workspace.getConfiguration('cleantex').get('command');
				const command = `\\${commandName}{`;
		
				// clean the text
				let [output, counter] = cleanString(input, command);
		
				// replace the text in the editor
				editor.edit(editBuilder => {
					editBuilder.replace(selection, output);
				});
		
				// show a message to the user
				let commandNameText = counter === 1 ? commandName : commandName + 's';
				let message = counter === 0 ? `No ${commandName}s found.` : `Removed ${counter} ${commandNameText}.`;
				vscode.window.showInformationMessage(message);
			}
		}
		else {
			vscode.window.showErrorMessage('No active editor found.');
		}
	});

	// Register the command to wrap the selected text in the command
	let wrapSelection = vscode.commands.registerCommand('cleantex.wrapSelection', () => {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			if (editor.selection.isEmpty) {
				vscode.window.showErrorMessage('No text selected.');
				return;
			}
			else {
				let selection = editor.selection;
				let input = editor.document.getText(selection);
				const commandName = vscode.workspace.getConfiguration('cleantex').get('command');
				editor.edit(editBuilder => {
					editBuilder.replace(selection, `\\${commandName}{${input}}`);
				});
			}
		}
		else {
			vscode.window.showErrorMessage('No active editor found.');
		}
	});

	// Add the commands to the context
	context.subscriptions.push(cleanFiles);
	context.subscriptions.push(cleanSelection);
	context.subscriptions.push(wrapSelection);
}

// This method is called when the extension is deactivated
export function deactivate() {}