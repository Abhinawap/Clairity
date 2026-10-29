import * as vscode from "vscode";
import { spawn, ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import WebSocket from "ws";

const DEV_SERVER_URL_PATTERN = /https?:\/\/localhost:\d+/;
const BACKEND_WS_BASE_URL = "ws://localhost:8787";

export class SessionManager {
  readonly sessionId: string;
  private devServerProcess: ChildProcess | undefined;
  private devServerUrl: string | undefined;
  private socket: WebSocket | undefined;
  private readonly output: vscode.OutputChannel;

  constructor(private readonly workspaceRoot: string) {
    this.sessionId = randomUUID();
    this.output = vscode.window.createOutputChannel("Clairity");
  }

  /** onReady fires once the backend socket is open and session:ready has been sent. */
  async start(onReady?: () => void): Promise<void> {
    this.output.appendLine(`[clairity] session ${this.sessionId} starting in ${this.workspaceRoot}`);
    await this.startDevServer();
    this.connectToBackend(onReady);
  }

  private startDevServer(): Promise<void> {
    return new Promise((resolve) => {
      this.devServerProcess = spawn("npx", ["next", "dev"], {
        cwd: this.workspaceRoot,
        shell: true,
      });

      this.devServerProcess.stdout?.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        this.output.append(text);

        if (!this.devServerUrl) {
          const match = text.match(DEV_SERVER_URL_PATTERN);
          if (match) {
            this.devServerUrl = match[0];
            this.output.appendLine(`[clairity] dev server detected at ${this.devServerUrl}`);
            resolve();
          }
        }
      });

      this.devServerProcess.stderr?.on("data", (chunk: Buffer) => {
        this.output.append(chunk.toString());
      });

      this.devServerProcess.on("exit", (code) => {
        this.output.appendLine(`[clairity] dev server exited with code ${code}`);
      });
    });
  }

  private connectToBackend(onReady?: () => void): void {
    // The broker pairs this socket with the web app's socket by sessionId; both must send role too.
    const url = `${BACKEND_WS_BASE_URL}?sessionId=${this.sessionId}&role=extension`;
    this.socket = new WebSocket(url);

    this.socket.on("open", () => {
      this.output.appendLine(`[clairity] connected to backend at ${url}`);
      this.socket?.send(
        JSON.stringify({
          type: "session:ready",
          sessionId: this.sessionId,
          devServerUrl: this.devServerUrl,
        })
      );
      onReady?.();
    });

    this.socket.on("error", (err: Error) => {
      this.output.appendLine(`[clairity] backend connection error: ${err.message}`);
    });

    this.socket.on("close", () => {
      this.output.appendLine("[clairity] backend connection closed");
    });
  }

  /** Sends a protocol message to the backend if the socket is open; logs and drops it otherwise. */
  send(message: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.output.appendLine(`[clairity] dropped message, socket not open: ${JSON.stringify(message)}`);
    }
  }

  dispose(): void {
    this.socket?.close();
    this.devServerProcess?.kill();
  }
}