const vscode = require('vscode');
const math = require('../lib/mathjs-bundle.js'); // Adjust the path as needed

/**
 * Processes a single line for math expressions
 * Processes mathematical expressions in a given text and replaces them with their evaluated results.
 * The method identifies expressions involving basic arithmetic, logarithms, square roots, powers, and percentages.
 */
async function processLine(document, lineNumber) {
    try {
        // Get the specific line (1-based index converted to 0-based)
        const line = document.lineAt(lineNumber);
        const lineContent = line.text; // Get the current content of the line

        // Define patterns for different types of expressions
        const patternLogical = "(?:(\\(|\\))(?:\\s?))+";
        const patternMathFunctions = "((?:(?:Math\\.)?(?:log|sqrt|pow|exp|abs|acos|acosh|asin|asinh|atan|atan2|atanh|bigmul|bitdecrement|bitincrement|cbrt|ceiling|clamp|copysign|cos|cosh|civrem|exp|floor|fusedmultiplyadd|ieeeremainder|ilogb|log|log10|log2|max|maxmagnitude|min|minmagnitude|pow|reciprocalestimate|reciprocalsqrtestimate|round|scaleb|sign|sin|sincos|sinh|sqrt|tan|tanh|truncate)|[0-9+\\-*/^:().%]|(?:,\\s?)){3,})";
        const patternEqualityCheck = "(=)(?![NULL]|[a-zA-Z$]|([\[])\s*(?:\d+(?:\s*,\s*\d+)*\s*)?([\]])?|[True]|[False]|-)(?!\\d+)";
        
        // Combine all parts
        const fullPattern = `(?<!\\w)(${patternLogical}|${patternMathFunctions})${patternEqualityCheck}`;
        const regex = new RegExp(fullPattern, "gi");

        // Process the line for math expressions
        const newLineContent = lineContent.replace(regex, (match, expression) => {
            const originalExpression = expression.trim();

            // Convert percentages to decimal
            let modifiedExpression = originalExpression;

            // Replace commas inside parentheses that are not followed by a space
            modifiedExpression = modifiedExpression.replace(/\(([^)]+)\)/g, (match) => {
                // Inside the parentheses, replace commas that are not followed by a space
                return match.replace(/,(?!\s)/g, ', ');
            });

            // Convert to lower case and fix Math.js usage
            modifiedExpression = modifiedExpression.toLowerCase().replace(/math\./g, ""); // remove the Math.

            let result;
            try {
                //result = evaluateCustomSyntax(modifiedExpression);
                result = math.evaluate(modifiedExpression);

                // Format the result
                // Handle DenseMatrix or other special types
                if (result instanceof math.Matrix) {
                    //result = result.toArray(); // Convert DenseMatrix to a JavaScript array
                } else if (Array.isArray(result)) {
                    result = result.toString(); // Convert arrays to string
                } else if (typeof result === 'number' && !isNaN(result)) {
                    result = (result % 1 === 0) ? result.toString() : result.toFixed(2);
                } else {
                    result = 'NULL'; // Handle non-numeric and non-array results
                }

            } catch (e) {
                result = 'NULL';
            }

            return `${originalExpression}=${result}`;
        });

        // Update the line with the new content
        if (newLineContent !== lineContent) {
            // Create a workspace edit
            const edit = new vscode.WorkspaceEdit();
            const range = new vscode.Range(line.range.start, line.range.end);
            edit.replace(document.uri, range, newLineContent);

            // Apply the workspace edit
            await vscode.workspace.applyEdit(edit);
        }
    } catch (error) {
        console.error("[Notepad Math] processLine error:", error.message)
    }
}

module.exports = processLine;