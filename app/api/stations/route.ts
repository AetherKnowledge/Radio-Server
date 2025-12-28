import { getStation } from "@/app/components/Home/StationActions";
import { BandType } from "@/generated/prisma/enums";
import { YoutubeService } from "@/lib/YoutubeService";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const bandType = request.nextUrl.searchParams.get("bandType")?.toUpperCase();

  if (!bandType || !Object.values(BandType).includes(bandType as BandType)) {
    return new Response(JSON.stringify({ error: "Invalid band type" }), {
      status: 400,
    });
  }

  const channel = request.nextUrl.searchParams.get("channel");

  if (channel === null || isNaN(Number(channel))) {
    return new Response(JSON.stringify({ error: "Invalid channel" }), {
      status: 400,
    });
  }

  const station = await getStation(bandType as BandType, Number(channel));
  if (!station.success || !station.data) {
    return new Response(JSON.stringify({ error: "Failed to get stream URL" }), {
      status: 500,
    });
  }

  let youtubeService: YoutubeService | null = null;

  try {
    // Reuse existing service if available, or create new one
    youtubeService = YoutubeService.createService(station.data);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to initialize YouTube service" }),
      { status: 500 }
    );
  }

  // Create a new stream for this client (shares underlying process)
  const clientStream = youtubeService.createStreamForClient();

  return new Response(clientStream, {
    headers: {
      "Content-Type": "video/mp4",
      "Cache-Control": "no-cache",
    },
  });
}
