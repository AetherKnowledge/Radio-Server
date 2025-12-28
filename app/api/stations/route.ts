import { getStation } from "@/app/components/Home/StationActions";
import { BandType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { YoutubeService } from "@/lib/YoutubeService";
import { env } from "next-runtime-env";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const bandType = request.nextUrl.searchParams.get("bandType")?.toUpperCase();

  if (env("REQUIRE_AUTHENTICATION") === "true") {
    const authHeader = request.headers.get("Authorization");

    const settings = await prisma.settings.findFirst();
    const apiKey = settings?.apiKey;

    if (apiKey && (!authHeader || authHeader.substring(7) !== apiKey)) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
  }

  if (!bandType || !Object.values(BandType).includes(bandType as BandType)) {
    return new NextResponse(JSON.stringify({ error: "Invalid band type" }), {
      status: 400,
    });
  }

  const channel = request.nextUrl.searchParams.get("channel");

  if (channel === null || isNaN(Number(channel))) {
    return new NextResponse(JSON.stringify({ error: "Invalid channel" }), {
      status: 400,
    });
  }

  const station = await getStation(bandType as BandType, Number(channel));
  if (!station.success || !station.data) {
    return new NextResponse(
      JSON.stringify({ error: "Failed to get stream URL" }),
      {
        status: 500,
      }
    );
  }

  let youtubeService: YoutubeService | null = null;

  try {
    // Reuse existing service if available, or create new one
    youtubeService = YoutubeService.createService(station.data);
  } catch (err) {
    return new NextResponse(
      JSON.stringify({ error: "Failed to initialize YouTube service" }),
      { status: 500 }
    );
  }

  // Create a new stream for this client (shares underlying process)
  const clientStream = youtubeService.createStreamForClient();

  return new NextResponse(clientStream, {
    headers: {
      "Content-Type": "video/mp4",
      "Cache-Control": "no-cache",

      // custom header to identify stream source
      "X-Stream-Source": "youtube",
      "X-Stream-Type": youtubeService.isLive ? "live" : "video",
      "X-Station-ID": station.data.id,
      "X-Station-Name": station.data.name,
      "X-Station-Stream-URL": station.data.streamUrl,
      "X-Station-Band-Type": station.data.bandType,
      "X-Station-Lowest-Frequency": station.data.lowestFrequency.toString(),
      "X-Station-Highest-Frequency": station.data.highestFrequency.toString(),
    },
  });
}
