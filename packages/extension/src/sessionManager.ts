import * as vscode from "vscode";
import { spawn, ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import WebSocket from "ws";

const DEV_SERVER_URL_PATTERN = /https?:\/\/localhost:\d+/;
// How long to wait before each reconnect after a drop: it grows from the first value to the last and stays there.
const RETRY_DELAYS_MS = [250, 500, 1000, 2000, 5000];

// Both addresses are settings (clairity.brokerUrl, clairity.webAppUrl), so a hosted broker or web app needs no rebuild.
function setting(key: "brokerUrl" | "webAppUrl"): string {
  const defaults = { brokerUrl: "ws://localhost:8787", webAppUrl: "http://localhost:3100" };
  return vscode.workspace.getConfiguration("clairity").get<string>(key) || defaults[key];
}

export class SessionManager {
  readonly sessionId: string;
  private devServerProcess: ChildProcess | undefined;
  private devServerUrl: string | undefined;
  private socket: WebSocket | undefined;
  private disposed = false;
  private attempt = 0;
  private retry: ReturnType<typeof setTimeout> | undefined;
  private readonly output: vscode.OutputChannel;

  constructor(private readonly workspaceRoot: string) {
    this.sessionId = randomUUID();
    this.output = vscode.window.createOutputChannel("Clairity");
  }

  /** The web app's editor for this session: it connects to the broker for the session ID in its address. */
  get editorUrl(): string {
    const url = new URL("/editor", setting("webAppUrl"));
    url.searchParams.set("session", this.sessionId);
    return url.toString();
  }

  /**
   * onReady fires each time the backend socket opens (first connect and every reconnect) once session:ready
   * has been sent, so the caller can resend graph:full. and session:ready has been sent.
   * onMessage fires for every protocol message relayed from the web app (via the broker).
   */
  async start(onReady?: () => void, onMessage?: (message: unknown) => void): Promise<void> {
    this.output.appendLine(`[clairity] session ${this.sessionId} starting in ${this.workspaceRoot}`);
    await this.startDevServer();
    this.connectToBackend(onReady, onMessage);
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

  private connectToBackend(onReady?: () => void, onMessage?: (message: unknown) => void): void {
    // The broker pairs this socket with the web app's socket by sessionId; both must send role too.
    const url = new URL(setting("brokerUrl"));
    url.searchParams.set("sessionId", this.sessionId);
    url.searchParams.set("role", "extension");
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.on("open", () => {
      this.attempt = 0;
      this.output.appendLine(`[clairity] connected to backend at ${url}`);
      socket.send(
        JSON.stringify({
          type: "session:ready",
          sessionId: this.sessionId,
          devServerUrl: this.devServerUrl,
        })
      );
      onReady?.();
    });

    socket.on("message", (data) => {
      try {
        onMessage?.(JSON.parse(data.toString()));
      } catch (err) {
        this.output.appendLine(`[clairity] failed to parse incoming message: ${(err as Error).message}`);
      }
    });

    socket.on("error", (err: Error) => {
      this.output.appendLine(`[clairity] backend connection error: ${err.message}`);
    });

    // A failed connect fires close too, so retrying lives here only. The broker asks for graph:full again when the
    // web app rejoins, and onReady resends it when this socket reconnects (project spec, failure handling).
    socket.on("close", () => {
      if (this.disposed || this.socket !== socket) {
        return;
      }
      const delay = RETRY_DELAYS_MS[Math.min(this.attempt++, RETRY_DELAYS_MS.length - 1)];
      this.output.appendLine(`[clairity] backend connection closed; reconnecting in ${delay} ms`);
      this.retry = setTimeout(() => this.connectToBackend(onReady, onMessage), delay);
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
    this.disposed = true;
    clearTimeout(this.retry);
    this.socket?.close();
    this.devServerProcess?.kill();
  }
}