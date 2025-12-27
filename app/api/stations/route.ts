import { SignalType } from "@/app/components/types";
import { spawn } from "child_process";
import { NextRequest } from "next/server";
import kill from "tree-kill";

export function GET(request: NextRequest) {
  const signalType = request.nextUrl.searchParams
    .get("signalType")
    ?.toUpperCase();

  if (
    !signalType ||
    !Object.values(SignalType).includes(signalType as SignalType)
  ) {
    return new Response(JSON.stringify({ error: "Invalid signal type" }), {
      status: 400,
    });
  }

  const channel = request.nextUrl.searchParams.get("channel");

  if (channel === null || isNaN(Number(channel))) {
    return new Response(JSON.stringify({ error: "Invalid channel" }), {
      status: 400,
    });
  }

  const url = "https://www.youtube.com/watch?v=XSXEaikz0Bc";

  const ytdlp = spawn("yt-dlp", ["--no-live-from-start", "-o", "-", url]);

  // Kill yt-dlp if client disconnects
  request.signal.addEventListener("abort", () => {
    console.log("Client disconnected, killing yt-dlp and all child processes");
    if (ytdlp.pid) {
      kill(ytdlp.pid);
    }
  });

  // Create a ReadableStream from the stdout
  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;

      const onData = (chunk: Buffer) => {
        if (!isClosed) {
          try {
            controller.enqueue(chunk);
          } catch (err) {
            console.error("Error enqueueing chunk:", err);
            isClosed = true;
            if (ytdlp.pid) {
              kill(ytdlp.pid);
            }
          }
        }
      };

      const onStderr = (chunk: Buffer) => {
        console.error("STDERR:", chunk.toString());
      };

      const onClose = (code: number | null) => {
        if (isClosed) return;
        isClosed = true;

        ytdlp.stdout.removeListener("data", onData);
        ytdlp.stderr.removeListener("data", onStderr);

        if (code === 0) {
          try {
            controller.close();
          } catch (err) {
            console.error("Error closing controller:", err);
          }
        } else {
          try {
            controller.error(new Error(`yt-dlp exited with code ${code}`));
          } catch (err) {
            console.error("Error erroring controller:", err);
          }
        }
      };

      const onError = (err: Error) => {
        console.error("Process error:", err);
        if (!isClosed) {
          isClosed = true;
          try {
            controller.error(err);
          } catch (e) {
            console.error("Error erroring controller:", e);
          }
        }
      };

      ytdlp.stdout.on("data", onData);
      ytdlp.stderr.on("data", onStderr);
      ytdlp.on("close", onClose);
      ytdlp.on("error", onError);
    },
    cancel() {
      console.log("Stream cancelled, killing yt-dlp and all child processes");
      if (ytdlp.pid) {
        kill(ytdlp.pid);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "audio/webm",
      "Cache-Control": "no-cache",
    },
  });
}
