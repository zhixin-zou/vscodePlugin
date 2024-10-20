import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const provider = new InputViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(InputViewProvider.viewType, provider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('myInputExtension.submitInput', () => {
            provider.submitInput();
        })
    );
}

class InputViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'myInputExtension.inputView';

    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.command) {
                case 'inputSubmitted':
                    vscode.window.showInformationMessage(`输入的内容是: ${data.value}`);
                    break;
            }
        });
    }

    public submitInput() {
        if (this._view) {
            this._view.show?.(true);
            this._view.webview.postMessage({ command: 'submitInput' });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const nonce = getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>输入框示例</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 10px;
                }
                input {
                    margin-right: 10px;
                }
            </style>
        </head>
        <body>
            <h1>输入框示例</h1>
            <input type="text" id="inputBox" placeholder="请输入内容" />
            <button id="submitButton">提交</button>
            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                document.getElementById('submitButton').onclick = () => {
                    const inputValue = document.getElementById('inputBox').value;
                    vscode.postMessage({ command: 'inputSubmitted', value: inputValue });
                };
            </script>
        </body>
        </html>`;
    }
}

export function deactivate() {}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
