// The module 'vscode' contains the VS Code extensibility API
const vscode = require('vscode');
const processLine = require('./helpers/mathHelper.js');

// Property to prevent recursive calls
let isProcessing = false;

// Global variable to store the disposable
let editorContentChangeListener;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// Register the content change listener
	editorContentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
		if (isPlainTextDocument(event.document)) {
			// Handle text document changes only for plaintext documents
			// Call the debounced function with the document
            debouncedProcess(event);
		}
	});

	context.subscriptions.push(editorContentChangeListener);
}

// This method is called when your extension is deactivated
function deactivate() {
	// Dispose of the event listener if it exists
	if (editorContentChangeListener) {
		editorContentChangeListener.dispose();
	}
}

/**
 * Processes lines that have changed based on the event information.
 * This function is more efficient for handling updates as it focuses on the lines that have changed.
 * @param {Object} event - The event object containing information about changes in the model.
 */
function processLineChanged(event) {
	if (isProcessing) return; // Prevent recursive calls
	isProcessing = true;

	try {
		// Get the active text editor
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			vscode.window.showInformationMessage('No active editor found.');
			return;
		}

		// Retrieve the document from the editor
		const document = editor.document;

		// Iterate over the changes in the delta
		event.contentChanges.forEach(change => {
			const startLine = change.range.start.line;
			const endLine = change.range.end.line;

			// Process each line within the changed range
			for (let i = startLine; i <= endLine; i++) {
				processLine(document, i);
			}
		});

	} catch (error) {
		console.error('[Notepad Math] Error processing changes:', error.message);
	} finally {
		isProcessing = false; // Reset flag
	}
}

// Debounced function to process expressions on content change
const debouncedProcess = debounce((event) => {
    // Processing logic for plaintext documents
    processLineChanged(event);
}, 120);

// Debounce function
function debounce(func, wait) {
	let timeout;
	return function (...args) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
};

function isPlainTextDocument(document) {
	return document.languageId === 'plaintext';
}

module.exports = {
	activate,
	deactivate
}
