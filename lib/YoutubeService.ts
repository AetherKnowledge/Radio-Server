import { Station } from "@/generated/prisma/browser";
import {
  ChildProcessWithoutNullStreams,
  spawn,
  spawnSync,
} from "child_process";
import kill from "tree-kill";

// #TODO: fix the vod player and allow playlists

export class YoutubeService {
  public station: Station;
  public isLive: boolean;
  public videoStream: ReadableStream<Uint8Array> | null = null;
  public ytDlpProcess: ChildProcessWithoutNullStreams | null = null;
  public ffmpegProcess: ChildProcessWithoutNullStreams | null = null;

  private streamControllers: Set<ReadableStreamDefaultController<Uint8Array>> =
    new Set();
  private activeConnections: number = 0;
  private chunkBuffer: Uint8Array[] = [];
  private readonly MAX_BUFFER_SIZE = 50; // Keep first 50 chunks for new clients

  public static playingStreams: Map<string, YoutubeService> = new Map();
  private verboseLogging: boolean = true;

  private constructor(station: Station) {
    this.station = station;
    let url = station.streamUrl;
    if (!YoutubeService.isValidYoutube(station.streamUrl)) {
      console.error("Invalid YouTube URL, finding latest valid video...");
      const latest = YoutubeService.getLatestStream(station.streamUrl);
      if (latest === null) {
        throw new Error("No valid videos found for the given URL");
      }
      url = latest;
    }

    const isLive = YoutubeService.isLiveStream(url);
    if (isLive) {
      this.isLive = true;
      this.createLiveStream(url);
      // Only cache livestreams for sharing
      YoutubeService.playingStreams.set(station.id, this);
    } else {
      this.isLive = false;
      this.createVODStream(url);
      // Don't cache VODs - each client gets their own from the start
    }
  }

  public static createService(station: Station): YoutubeService {
    console.log(YoutubeService.playingStreams.values().map((s) => s.station));
    const existingStream = YoutubeService.playingStreams.get(station.id);
    if (existingStream) {
      console.log("Reusing existing livestream service");
      return existingStream;
    }
    const newService = new YoutubeService(station);
    return newService;
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

    if (this.verboseLogging) {
      this.ytDlpProcess.stderr.on("data", (chunk: Buffer) => {
        console.error("yt-dlp STDERR:", chunk.toString());
      });
    }

    // Broadcast data to all connected controllers
    this.ffmpegProcess.stdout.on("data", (chunk: Buffer) => {
      const uint8Chunk = new Uint8Array(chunk);

      // Buffer initial chunks for new clients
      if (this.chunkBuffer.length < this.MAX_BUFFER_SIZE) {
        console.log(
          `Buffering chunk of size ${uint8Chunk.length} bytes current buffer size: ${this.chunkBuffer.length}`
        );
        this.chunkBuffer.push(uint8Chunk);
      }

      this.streamControllers.forEach((controller) => {
        try {
          controller.enqueue(uint8Chunk);
        } catch (err) {
          console.error("Error enqueueing chunk to controller:", err);
          this.streamControllers.delete(controller);
        }
      });
    });

    if (this.verboseLogging) {
      this.ffmpegProcess.stderr.on("data", (chunk: Buffer) => {
        console.error("ffmpeg STDERR:", chunk.toString());
      });
    }

    this.ffmpegProcess.on("close", (code: number | null) => {
      console.log(`ffmpeg closed with code ${code}`);
      this.streamControllers.forEach((controller) => {
        try {
          if (code === 0) {
            controller.close();
          } else {
            controller.error(new Error(`ffmpeg exited with code ${code}`));
          }
        } catch (err) {
          console.error("Error closing controller:", err);
        }
      });
      this.streamControllers.clear();
    });

    this.ffmpegProcess.on("error", (err: Error) => {
      console.error("ffmpeg error:", err);
      this.streamControllers.forEach((controller) => {
        try {
          controller.error(err);
        } catch (e) {
          console.error("Error erroring controller:", e);
        }
      });
      this.streamControllers.clear();
    });
  }

  private createVODStream(url: string) {
    const ytdlp = spawn("yt-dlp", [
      "-f",
      "bestaudio/worstvideo*",
      "--no-playlist",
      "-o",
      "-",
      url,
    ]);
    this.ytDlpProcess = ytdlp;

    // Broadcast data to all connected controllers
    ytdlp.stdout.on("data", (chunk: Buffer) => {
      const uint8Chunk = new Uint8Array(chunk);

      // Buffer initial chunks for new clients
      if (this.chunkBuffer.length < this.MAX_BUFFER_SIZE) {
        this.chunkBuffer.push(uint8Chunk);
      }

      this.streamControllers.forEach((controller) => {
        try {
          controller.enqueue(uint8Chunk);
        } catch (err) {
          console.error("Error enqueueing chunk to controller:", err);
          this.streamControllers.delete(controller);
        }
      });
    });

    if (this.verboseLogging) {
      ytdlp.stderr.on("data", (chunk: Buffer) => {
        console.error("yt-dlp STDERR:", chunk.toString());
      });
    }

    ytdlp.on("close", (code: number | null) => {
      console.log(`yt-dlp closed with code ${code}`);
      this.streamControllers.forEach((controller) => {
        try {
          if (code === 0) {
            controller.close();
          } else {
            controller.error(new Error(`yt-dlp exited with code ${code}`));
          }
        } catch (err) {
          console.error("Error closing controller:", err);
        }
      });
      this.streamControllers.clear();
    });

    ytdlp.on("error", (err: Error) => {
      console.error("yt-dlp error:", err);
      this.streamControllers.forEach((controller) => {
        try {
          controller.error(err);
        } catch (e) {
          console.error("Error erroring controller:", e);
        }
      });
      this.streamControllers.clear();
    });
  }

  public static getLatestStream(channelUrl: string, requireLive = true) {
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

  public createStreamForClient(): ReadableStream<Uint8Array> {
    this.activeConnections++;
    console.log(`Active connections: ${this.activeConnections}`);

    return new ReadableStream({
      start: (controller) => {
        // Send buffered chunks to new client first
        for (const chunk of this.chunkBuffer) {
          try {
            controller.enqueue(chunk);
          } catch (err) {
            console.error("Error enqueueing buffered chunk:", err);
            return;
          }
        }

        // Add controller to receive live data
        this.streamControllers.add(controller);
      },
      cancel: () => {
        this.activeConnections--;
        console.log(
          `Connection closed. Active connections: ${this.activeConnections}`
        );

        // Only kill processes when all connections are closed
        if (this.activeConnections === 0) {
          console.log("No active connections, stopping stream");
          this.stopStream();
          // Only remove from cache if it was cached (livestreams only)
          if (this.isLive) {
            YoutubeService.playingStreams.delete(this.station.id);
          }
        }
      },
    });
  }

  private stopStream() {
    this.streamControllers.clear();
    this.chunkBuffer = [];

    if (this.ffmpegProcess && this.ffmpegProcess.pid) {
      kill(this.ffmpegProcess.pid);
    }
    if (this.ytDlpProcess && this.ytDlpProcess.pid) {
      kill(this.ytDlpProcess.pid);
    }
  }
}
