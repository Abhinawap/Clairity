import * as vscode from "vscode";
import { spawn, ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import WebSocket from "ws";

const DEV_SERVER_URL_PATTERN = /https?:\/\/localhost:\d+/;
const BACKEND_WS_URL = "ws://localhost:8787"; // placeholder until packages/server exists

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

  async start(): Promise<void> {
    this.output.appendLine(`[clairity] session ${this.sessionId} starting in ${this.workspaceRoot}`);
    await this.startDevServer();
    this.connectToBackend();
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

  private connectToBackend(): void {
    this.socket = new WebSocket(BACKEND_WS_URL);

    this.socket.on("open", () => {
      this.output.appendLine(`[clairity] connected to backend at ${BACKEND_WS_URL}`);
      this.socket?.send(
        JSON.stringify({
          type: "session:ready",
          sessionId: this.sessionId,
          devServerUrl: this.devServerUrl,
        })
      );
    });

    this.socket.on("error", (err: Error) => {
      this.output.appendLine(`[clairity] backend connection error: ${err.message}`);
    });

    this.socket.on("close", () => {
      this.output.appendLine("[clairity] backend connection closed");
    });
  }

  dispose(): void {
    this.socket?.close();
    this.devServerProcess?.kill();
  }
}