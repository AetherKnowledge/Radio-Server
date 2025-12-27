import { YoutubeService } from "@/lib/YoutubeService";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const latestStream = YoutubeService.getLatestStream(
    "https://www.youtube.com/@alanbecker",
    true
  );

  return new Response(JSON.stringify({ latestStream }), {
    status: 200,
  });
}
