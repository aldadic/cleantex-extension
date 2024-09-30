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
