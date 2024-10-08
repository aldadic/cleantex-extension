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

		// get mode from configuration
		const mode = vscode.workspace.getConfiguration('cleantex').get('mode');

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
			let [output, counter] = cleanString(input, command, mode === 'remove');
			await vscode.workspace.fs.writeFile(uri, Buffer.from(output));
			return counter;
		});

		// show a message to the user
		let counters = await Promise.all(files);
		let nonZero = counters.filter((val) => val > 0);
		let total = counters.reduce((acc, val) => acc + val, 0);
		let commandNameText = total === 1 ? commandName : commandName + 's';
		let filesText = nonZero.length === 1 ? 'file' : 'files';
		let modeText = mode === 'remove' ? 'Removed' : 'Unwrapped';
		let message = total === 0 ? `No ${commandName}s found.` : `${modeText} ${total} ${commandNameText} in ${nonZero.length} ${filesText}.`;
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

				// get mode from configuration
				const mode = vscode.workspace.getConfiguration('cleantex').get('mode');
		
				// clean the text
				let [output, counter] = cleanString(input, command, mode === 'remove');
		
				// replace the text in the editor
				editor.edit(editBuilder => {
					editBuilder.replace(selection, output);
				});
		
				// show a message to the user
				let commandNameText = counter === 1 ? commandName : commandName + 's';
				let modeText = mode === 'remove' ? 'Removed' : 'Unwrapped';
				let message = counter === 0 ? `No ${commandName}s found.` : `${modeText} ${counter} ${commandNameText}.`;
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

	// Register the command to toggle cleaning and unwrapping based on if the selection contains the command or not
	let toggleSelection = vscode.commands.registerCommand('cleantex.toggleSelection', () => {
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

				// get mode from configuration
				const mode = vscode.workspace.getConfiguration('cleantex').get('mode');
		
				// clean the text
				let [output, counter] = cleanString(input, command, mode === 'remove');

				// if no commands were found, wrap the selection
				if (counter === 0) {
					editor.edit(editBuilder => {
						editBuilder.replace(selection, `\\${commandName}{${input}}`);
					});
				}
				// if commands were found, remove them
				else {
					// replace the text in the editor
					editor.edit(editBuilder => {
						editBuilder.replace(selection, output);
					});
			
					// show a message to the user
					let commandNameText = counter === 1 ? commandName : commandName + 's';
					let modeText = mode === 'remove' ? 'Removed' : 'Unwrapped';
					let message = counter === 0 ? `No ${commandName}s found.` : `${modeText} ${counter} ${commandNameText}.`;
					vscode.window.showInformationMessage(message);
				}
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
	context.subscriptions.push(toggleSelection);
}

// This method is called when the extension is deactivated
export function deactivate() {}