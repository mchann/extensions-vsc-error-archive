import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "error-archive" is now active!');
    
    let setTokenCommand = vscode.commands.registerCommand('error-archive.setToken', async () => {
        const token = await vscode.window.showInputBox({
            prompt: 'Masukkan API Token dari Dashboard Error Archive kamu',
            password: true, 
            ignoreFocusOut: true
        });

        if (token) {
            await context.secrets.store('errorArchiveApiToken', token);
            vscode.window.showInformationMessage('API Token Error Archive berhasil disimpan!');
        } else {
            vscode.window.showErrorMessage('Penyimpanan token dibatalkan.');
        }
    });

    let saveErrorCommand = vscode.commands.registerCommand('error-archive.saveError', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Buka file kode terlebih dahulu!');
            return;
        }
        
        // teks highlighted di editor
        const selection = editor.selection;
        const highlightedText = editor.document.getText(selection);

        if (!highlightedText) {
            vscode.window.showWarningMessage('Blok (highlight) teks error-nya terlebih dahulu!');
            return;
        }

        const savedToken = await context.secrets.get('errorArchiveApiToken');
        
        if (!savedToken) {
            vscode.window.showErrorMessage('API Token belum diset! Jalankan perintah "Error Archive: Set API Token" terlebih dahulu.');
            return;
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Menyimpan error ke dashboard...",
            cancellable: false
        }, async (progress) => {
            try {
                const apiUrl = 'http://localhost:3000/api/errors'; 

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${savedToken}`
                    },
                    body: JSON.stringify({
                        title: "Disimpan dari VS Code",
                        category: "VS Code", 
                        errorMessage: highlightedText 
                    })
                });

                const data = await response.json() as any;

                if (response.ok) {
                    vscode.window.showInformationMessage('✅ Error berhasil disimpan ke Database!');
                } else {
                    vscode.window.showErrorMessage(`Gagal menyimpan: ${data.message || 'Error tidak diketahui'}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage('Gagal terhubung ke server. Pastikan web Next.js kamu sedang berjalan (npm run dev).');
                console.error(error);
            }
        });
    });

    context.subscriptions.push(setTokenCommand, saveErrorCommand);
}

export function deactivate() {}