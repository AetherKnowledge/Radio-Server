import {
  ChildProcessWithoutNullStreams,
  spawn,
  spawnSync,
} from "child_process";
import kill from "tree-kill";

export class YoutubeService {
  public url: string;
  public isLive: boolean;
  public videoStream: ReadableStream<Uint8Array> | null = null;
  public ytDlpProcess: ChildProcessWithoutNullStreams | null = null;
  public ffmpegProcess: ChildProcessWithoutNullStreams | null = null;

  public constructor(url: string) {
    if (!YoutubeService.isValidYoutube(url)) {
      console.error("Invalid YouTube URL, finding latest valid video...");
      const latest = YoutubeService.getLatestStream(url, true);
      if (latest === null) {
        throw new Error("No valid videos found for the given URL");
      }
      url = latest;
    }
    this.url = url;

    const isLive = YoutubeService.isLiveStream(url);
    if (isLive) {
      this.isLive = true;
      this.createLiveStream(url);
    } else {
      this.isLive = false;
      this.createVODStream(url);
    }
  }

  public static isValidYoutube(url: string): boolean {
    if (!url) return false;

    const ytRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|live\/|embed\/|v\/)?[A-Za-z0-9_-]{11}(&.*)?$/;
    return ytRegex.test(url);
  }

  public static isLiveStream(url: string): boolean {
    try {
      const result = spawnSync(
        "yt-dlp",
        ["--dump-json", "--no-playlist", url],
        {
          encoding: "utf-8",
        }
      );

      if (result.status !== 0) {
        console.error("yt-dlp error:", result.stderr);
        return false; // treat as not live if error
      }

      const info = JSON.parse(result.stdout);

      // yt-dlp may include is_live or live_status
      return info.is_live === true || info.live_status === "is_live";
    } catch (err) {
      console.error("Error checking live status:", err);
      return false;
    }
  }

  private createLiveStream(url: string) {
    // Use bestaudio/best to fallback to video+audio if audio-only not available
    const ytdlp = spawn("yt-dlp", [
      url,
      "-f bestaudio,worstvideo*",
      "--no-playlist",
      "-o",
      "-", // stdout
    ]);
    this.ytDlpProcess = ytdlp;

    // Pipe through ffmpeg to extract audio only
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      "pipe:0", // input from stdin
      "-vn", // no video
      "-acodec",
      "libopus", // encode to opus
      "-f",
      "opus", // opus format
      "pipe:1", // output to stdout
    ]);
    this.ffmpegProcess = ffmpeg;

    // Pipe yt-dlp output to ffmpeg input
    this.ytDlpProcess.stdout.pipe(this.ffmpegProcess.stdin);
    this.ytDlpProcess.stderr.on("data", (chunk: Buffer) => {
      console.error("yt-dlp STDERR:", chunk.toString());
    });

    // Create a ReadableStream from ffmpeg stdout
    this.videoStream = new ReadableStream({
      start(controller) {
        let isClosed = false;

        const onData = (chunk: Buffer) => {
          if (!isClosed) {
            try {
              controller.enqueue(chunk);
            } catch (err) {
              console.error("Error enqueueing chunk:", err);
              isClosed = true;
            }
          }
        };

        const onStderr = (chunk: Buffer) => {
          console.error("ffmpeg STDERR:", chunk.toString());
        };

        const onClose = (code: number | null) => {
          if (isClosed) return;
          isClosed = true;

          ffmpeg.stdout.removeListener("data", onData);
          ffmpeg.stderr.removeListener("data", onStderr);

          if (code === 0) {
            try {
              controller.close();
            } catch (err) {
              console.error("Error closing controller:", err);
            }
          } else {
            try {
              controller.error(new Error(`ffmpeg exited with code ${code}`));
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

        ffmpeg.stdout.on("data", onData);
        ffmpeg.stderr.on("data", onStderr);
        ffmpeg.on("close", onClose);
        ffmpeg.on("error", onError);
      },
      cancel() {
        console.log("Stream cancelled, killing processes");
        if (ffmpeg.pid) {
          kill(ffmpeg.pid);
        }
        if (ytdlp.pid) {
          kill(ytdlp.pid);
        }
      },
    });
  }

  private createVODStream(url: string) {
    const ytdlp = spawn("yt-dlp", [
      "-f",
      "bestaudio/worstvideo*",
      "-o",
      "-",
      url,
    ]);
    this.ytDlpProcess = ytdlp;

    this.videoStream = new ReadableStream({
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
  }

  public static getLatestStream(channelUrl: string, requireLive = false) {
    const result = spawnSync(
      "yt-dlp",
      [
        "--playlist-end",
        "2",
        "--flat-playlist",
        "--dump-json",
        "--no-warnings",
        channelUrl,
      ],
      { encoding: "utf-8" }
    );

    console.log("yt-dlp output:", result.stdout);

    if (result.status !== 0) {
      console.error("yt-dlp error:", result.stderr);
      return null;
    }

    const lines = result.stdout.trim().split("\n");
    const videos = lines.map((line) => JSON.parse(line));

    // Filter livestreams and past streams
    const liveOrVOD = videos.filter((v) =>
      requireLive ? v.is_live === true : true
    );

    // Sort by upload date
    liveOrVOD.sort((a, b) => (b.upload_date || 0) - (a.upload_date || 0));

    return liveOrVOD[0]?.url || null;
  }

  public stopStream() {
    if (this.ffmpegProcess && this.ffmpegProcess.pid) {
      kill(this.ffmpegProcess.pid);
    }
    if (this.ytDlpProcess && this.ytDlpProcess.pid) {
      kill(this.ytDlpProcess.pid);
    }
  }
}
