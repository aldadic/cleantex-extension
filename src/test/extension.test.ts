import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { cleanString, scanMacros } from '../clean';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	// Test general unwrapping functionality of the cleanString function
	test('cleanStringUnwrapping', () => {
		let input = 'This is a \\revision{test} string with two \\revision{revision} commands.';
		let command = '\\revision{';
		let [output, counter] = cleanString(input, command);
		assert.strictEqual(output, 'This is a test string with two revision commands.');
		assert.strictEqual(counter, 2);
	});

	// Test general removal functionality of the cleanString function
	test('cleanStringRemoval', () => {
		let input = 'This is a \\revision{test} string with two \\revision{revision} commands.';
		let command = '\\revision{';
		let [output, counter] = cleanString(input, command, true);
		assert.strictEqual(output, 'This is a  string with two  commands.');
		assert.strictEqual(counter, 2);
	});

	// Test the cleanString function for nested commands
	test('cleanStringNested', () => {
		let input = 'This is a \\revision{test with \\revision{nested} revisions}.';
		let command = '\\revision{';
		let [output, counter] = cleanString(input, command);
		assert.strictEqual(output, 'This is a test with nested revisions.');
		assert.strictEqual(counter, 2);
	});

	// Test the scanMacros function
	test('scanMacros', () => {
		// Create an output channel for the extension
		const logger = vscode.window.createOutputChannel('CleanTeX', {log: true});
		let input = `
			\\newcommand{\\revision}[1]{{\\color{red}#1}}
			\\newcommand{\\test}{test}
			\\newcommand{\\test2}{\\command{test}}
		`;
		let macros = scanMacros(input);
		assert.strictEqual(Object.keys(macros).length, 3);
		assert.strictEqual(macros['test'][0], 'test');
		assert.strictEqual(macros['test2'][0], '\\command{test}');
		assert.strictEqual(macros['revision'][0], '{\\color{red}#1}');
		assert.strictEqual(macros['test'][1], 0);
		assert.strictEqual(macros['test2'][1], 0);
		assert.strictEqual(macros['revision'][1], 1);
	});

});
