# CleanTeX

This is a simple extension to remove a specific LaTeX command (e.g. `\revision`) from a file or a selection of text.

## How to install

### Marketplace installation

You can install this extension from the Visual Studio Code marketplace by searching for `CleanTeX` in the extensions sidebar.

### Manual installation

Open the extension sidebar in Visual Studio Code and click on the three dots in the top right corner. Click on `Install from VSIX...` and select the `.vsix` file of this extension. This repository is set up to build the extension and upload it as an artifact on every push to the main branch. Therefore, you can go to the `Actions` tab of this repository and click on the latest workflow run to download a zip folder containing the `.vsix` file from the artifacts section.

## How to use

### Usage in the editor

1. Open a LaTeX file in the editor and make a selection.
2. Right-click and hover over the `CleanTeX` submenu in the context menu.
3. Click on `Clean current selection` to remove the command from the selected text. You can also wrap the selected text in the LaTeX command by clicking on `Wrap current selection`.

### Usage in the file explorer

1. Select one or more LaTeX files in the file explorer.
2. Right-click and hover over the `CleanTeX` submenu in the context menu.
3. Click on `Clean selected files` to remove the command from the selected files.

### Usage with commands

Alternatively, you can use the command palette to search for the commands:

* `CleanTeX: Clean selected files`
* `CleanTeX: Clean current selection`
* `CleanTeX: Wrap current selection`

You can also bind the commands to keyboard shortcuts to make them easier to use. Just open the keyboard shortcuts settings in Visual Studio Code and search for the commands above.

## Extension Settings

This extension contributes the following settings:

* `cleantex.command`: The LaTeX command to remove from the file or selection of text. Default is `revision`.
* `cleantex.makeBackup`: Whether to create a backup before cleaning a file (named `<filename>.old.<extension>`). Default is `false`.

## Credits

* <a href="https://www.flaticon.com/free-icons/cleaning-spray" title="cleaning spray icon">Cleaning spray icon created by Freepik - Flaticon</a>
