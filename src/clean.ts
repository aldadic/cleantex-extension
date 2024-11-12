// Function that removes the command and its arguments from the input string
// and returns the cleaned string and the number of commands found.

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

export function scanMacros(input: string): { [key: string]: string } {
	const macros: { [key: string]: string } = {};
	const command = '\\newcommand{';
	const commandLength = command.length;

	for (let i = 0; i < input.length; i++) {
		if (input.substring(i, i + commandLength) === command) {
			let j = i + commandLength;
			let macroName = '';
			while (input[j] !== '}') {
				macroName += input[j];
				j++;
			}
			j++;
			if (input[j] !== '{') {
				continue;
			}
			j++;
			let openBraces = 1;
			let macroDefinition = '';
			while (openBraces > 0) {
				macroDefinition += input[j];
				j++;
				if (input[j] === '{') {
					openBraces++;
				} else if (input[j] === '}') {
					openBraces--;
				}
			}
			macros[macroName] = macroDefinition;
		}
	}

	return macros;
}