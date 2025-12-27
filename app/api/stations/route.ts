import { getStation } from "@/app/components/Home/StationActions";
import { SignalType } from "@/generated/prisma/enums";
import { YoutubeService } from "@/lib/YoutubeService";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
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

  const station = await getStation(signalType as SignalType, Number(channel));
  if (!station.success || !station.data) {
    return new Response(JSON.stringify({ error: "Failed to get stream URL" }), {
      status: 500,
    });
  }

  let youtubeService: YoutubeService | null = null;

  try {
    youtubeService = new YoutubeService(station.data.streamUrl);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to initialize YouTube service" }),
      { status: 500 }
    );
  }

  if (!youtubeService.videoStream) {
    return new Response(
      JSON.stringify({ error: "Failed to create video stream" }),
      { status: 500 }
    );
  }

  request.signal.addEventListener("abort", () => {
    youtubeService.stopStream();
  });

  return new Response(youtubeService.videoStream, {
    headers: {
      "Content-Type": "video/mp4",
      "Cache-Control": "no-cache",
    },
  });
}
