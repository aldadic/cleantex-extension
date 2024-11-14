// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';

// Import the cleanString function from the clean module
import { cleanString, scanMacros, replaceMacros } from './clean';

// Create an output channel for the extension
const logger = vscode.window.createOutputChannel('CleanTeX', {log: true});

// Create a diagnostic collection for the extension
const diagnosticCollection = vscode.languages.createDiagnosticCollection("CleanTeX");
const diagnostics : vscode.Diagnostic[] = [];

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
				let oldUri = vscode.Uri.file(uri.fsPath.substring(0, uri.fsPath.lastIndexOf('.')) + '.old' + uri.fsPath.substring(uri.fsPath.lastIndexOf('.')));
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

	let replaceMacrosFiles = vscode.commands.registerCommand('cleantex.replaceMacrosInFiles', async (_contextSelection: vscode.Uri, allSelections: vscode.Uri[]) => {
		// clear the diagnostics
		diagnosticCollection.clear();

		// get the paths to the files containing the macros
		const macroPaths = vscode.workspace.getConfiguration('cleantex').get<string[]>('macroPaths');

		if (!macroPaths) {
			vscode.window.showErrorMessage('No macro file paths set.');
			return;
		}

		// get the macros from the file using the scanMacros function
		const macros: { [key: string]: [string, number, string | null] } = {};
		macroPaths.forEach(async (path) => {
			let uri = vscode.Uri.file(path);
			try {
				let document = await vscode.workspace.openTextDocument(uri);
				let scanned = scanMacros(document.getText(), logger);
				Object.assign(macros, scanned.macros);
				if (scanned.errors > 0) {
					vscode.window.showWarningMessage(`Found ${scanned.errors} errors while scanning macros in file at ${path}. Check the output channel for more information.`);
				}
			}
			catch (error) {
				console.error(error);
				vscode.window.showErrorMessage(`Error reading file at ${path}.`);
			}
		});

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
				let oldUri = vscode.Uri.file(uri.fsPath.substring(0, uri.fsPath.lastIndexOf('.')) + '.old' + uri.fsPath.substring(uri.fsPath.lastIndexOf('.')));
				await vscode.workspace.fs.writeFile(oldUri, Buffer.from(document.getText()));
			}
			// replace the macros in the document
			let output = document.getText();
			let counter = 0;
			for (let [name, [definition, args, optionalArgument]] of Object.entries(macros)) {
				let count = 0;
				[output, count] = replaceMacros(output, name, definition, args, optionalArgument);
				counter += count;
			}
			// add error to all non replaced macros
			for (let [name, [,]] of Object.entries(macros)) {
				let regex = new RegExp(`(?<!\\\\newcommand{)\\\\${name}`, 'g');
				let matches = output.matchAll(regex);
				for (let match of matches) {
					let position = match.index;
					if (position === undefined) {
						continue;
					}
					let line = document.positionAt(position).line;
					let column = position - document.offsetAt(new vscode.Position(line, 0));
					logger.error(`Could not replace macro \\${name} at ${line}:${column}`);
					diagnostics.push(new vscode.Diagnostic(new vscode.Range(line, column, line, column + name.length + 1), `Could not replace macro \\${name}`, vscode.DiagnosticSeverity.Error));
				}
			}
			diagnosticCollection.set(uri, diagnostics);

			await vscode.workspace.fs.writeFile(uri, Buffer.from(output));
			return counter;
		});

		// show a message to the user
		let counters = await Promise.all(files);
		let nonZero = counters.filter((val) => val > 0);
		let total = counters.reduce((acc, val) => acc + val, 0);
		let filesText = nonZero.length === 1 ? 'file' : 'files';
		let macroText = total === 1 ? 'macro' : 'macros';
		let message = total === 0 ? `No macros found to be replaced.` : `Replaced ${total} ${macroText} in ${nonZero.length} ${filesText}.`;
		vscode.window.showInformationMessage(message);
	});


	let replaceMacrosSelection = vscode.commands.registerCommand('cleantex.replaceMacrosInSelection', async () => {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			if (editor.selection.isEmpty) {
				vscode.window.showErrorMessage('No text selected.');
				return;
			}
			else {
				// get the paths to the files containing the macros
				const macroPaths = vscode.workspace.getConfiguration('cleantex').get<string[]>('macroPaths');

				if (!macroPaths) {
					vscode.window.showErrorMessage('No macro file paths set.');
					return;
				}

				// get the macros from the file using the scanMacros function
				const macros: { [key: string]: [string, number, string | null] } = {};
				macroPaths.forEach(async (path) => {
					let uri = vscode.Uri.file(path);
					try {
						let document = await vscode.workspace.openTextDocument(uri);
						let scanned = scanMacros(document.getText(), logger);
						Object.assign(macros, scanned.macros);
						if (scanned.errors > 0) {
							vscode.window.showWarningMessage(`Found ${scanned.errors} errors while scanning macros in file at ${path}. Check the output channel for more information.`);
						}
					}
					catch (error) {
						console.error(error);
						vscode.window.showErrorMessage(`Error reading file at ${path}.`);
					}
				});
		
				// replace the macros in the selection
				let selection = editor.selection;
				let output = editor.document.getText(selection);
				let counter = 0;
				for (let [name, [definition, args, optionalArgument]] of Object.entries(macros)) {
					let count = 0;
					[output, count] = replaceMacros(output, name, definition, args, optionalArgument);
					counter += count;
				}
		
				// replace the text in the editor
				editor.edit(editBuilder => {
					editBuilder.replace(selection, output);
				});
		
				// show a message to the user
				let macroText = counter === 1 ? 'macro' : 'macros';
				let message = counter === 0 ? `No macros found in selection.` : `Replaced ${counter} ${macroText}.`;
				vscode.window.showInformationMessage(message);
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
	context.subscriptions.push(replaceMacrosFiles);
	context.subscriptions.push(replaceMacrosSelection);
}

// This method is called when the extension is deactivated
export function deactivate() {}