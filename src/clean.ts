// Function that removes the command and its arguments from the input string
// and returns the cleaned string and the number of commands found.

import { parse } from "path";

export function cleanString(input: string, command: string, remove: boolean = false): [string, number] {
	let counter = 0;	// Counter for the number of commands found

	function clean(text: string) {
		let cleaned = '';
		let record = false;
		let temp = '';
		let openBraces = 0;

		for (let i = 0; i < text.length; i++) {
			if (text.substring(i, i + command.length) === command && !record) {
				record = true;
				openBraces++;
				i += command.length - 1; // Skip the '\revision{' substring
			} else if (text[i] === '{' && record) {
				temp += text[i];
				openBraces++;
			} else if (text[i] === '}' && record) {
				if (openBraces === 1) {
					record = false;
					if (!remove) {
						cleaned += temp;
					}
					temp = '';
					counter++;
				} else {
					temp += text[i];
				}
				openBraces--;
			} else if (record) {
				temp += text[i];
			} else {
				cleaned += text[i];
			}
		}

		return cleaned;
	}

	// Keep running the clean function until the string stops changing
	let output = clean(input);
	let previousOutput = input;
	while (output !== previousOutput) {
		previousOutput = output;
		output = clean(output);
	}

	return [output, counter];
}

// Function that scans the input string for macros and returns an object with the
// macro names and their definitions.

export function scanMacros(input: string): { [key: string]: [string, number, string | null] } {
	const macros: { [key: string]: [string, number, string | null] } = {};
	const command = '\\newcommand{';
	const commandLength = command.length;

	for (let i = 0; i < input.length; i++) {
		if (input.substring(i, i + commandLength) === command) {
			let j = i + commandLength;
			let macroName = '';
			let macroArguments = 0;
			let optionalArgument = null;
			while (input[j] !== '}') {
				macroName += input[j];
				j++;
			}
			j++;
			if (input[j] === '[') {
				let macroArgumentsString = '';
				j++;
				while (input[j] !== ']') {
					macroArgumentsString += input[j];
					j++;
				}
				macroArguments = parseInt(macroArgumentsString);
				j++;
			}
			if (input[j] === '[') {
				j++;
				optionalArgument = '';
				while (input[j] !== ']') {
					optionalArgument += input[j];
					j++;
				}
				j++;
			}
			j++;
			let openBraces = 1;
			let macroDefinition = '';
			while (openBraces > 0) {
				if (input[j] === '{') {
					openBraces++;
				} else if (input[j] === '}') {
					openBraces--;
				}
				macroDefinition += input[j];
				j++;
			}
			macroDefinition = macroDefinition.substring(0, macroDefinition.length - 1);
			macros[macroName] = [macroDefinition, macroArguments, optionalArgument];
		}
	}

	return macros;
}

// Function that replaces the macros in the input string with their definitions.
export function replaceMacros(input: string, name: string, definition: string, args: number, optionalArgument: string | null): [string, number] {
	let regex = new RegExp(`(?<!\\\\newcommand{)\\${name}`, 'g');
	let matches = input.matchAll(regex);
	// replace in reverse order to avoid changing the indices of the matches
	let matchesArray = Array.from(matches);
	for (let i = matchesArray.length - 1; i >= 0; i--) {
		let match = matchesArray[i];
		let start = match.index;
		let text = definition;
		if (start === undefined) {
			continue;
		}
		let j = start + match[0].length;
		if (args > 0) {
			let currentArgument = 0;
			let currentArgumentString = '';
			let argumentArray = [];
			while (input[j] !== '{' && input[j] !== '[') {
				j++;
			}
			if (optionalArgument !== null) {
				if (input[j] === '[') {
					j++;
					let optionalArgument = '';
					while (input[j] !== ']') {
						optionalArgument += input[j];
						j++;
					}
				}
				currentArgument++;
				argumentArray.push(optionalArgument);
			}
			j++;
			let openBraces = 1;
			while (j < input.length) {
				if (input[j] === '{') {
					openBraces++;
				} else if (input[j] === '}') {
					openBraces--;
				}
				if (openBraces === 0 && input[j] === '}') {
					currentArgument++;
					argumentArray.push(currentArgumentString);
					if (currentArgument === args) {
						j++;
						break;
					} else {
						currentArgumentString = '';
						while (input[j] !== '{') {
							j++;
						}
						openBraces = 1;
						j++;
					}
				}
				currentArgumentString += input[j];
				j++;
			}
			for (let i = 0; i < argumentArray.length; i++) {
				text = text.replace(`#${i + 1}`, argumentArray[i]);
			}
		}
		input = input.substring(0, start) + text + input.substring(j);
	}
	return [input, matchesArray.length];
}