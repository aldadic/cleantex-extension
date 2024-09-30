import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { cleanString } from '../clean';

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

});
