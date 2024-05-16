import axios from "axios";
import { load } from "cheerio";
import { sourceILoveMusic } from "./config.js";

export interface RadioChannel {
  name: string;
  url?: string;
  streamURL: string;
}

export async function fetchRadioChannels(): Promise<RadioChannel[]> {
  const { data } = await axios.get(sourceILoveMusic).catch(() => {
    throw new Error(`Failed to fetch channels from ${sourceILoveMusic}`);
  });

  const $ = load(data);
  const channels: RadioChannel[] = [];

  $("div.content:has(:any-link)").each((index, item) => {
    const content = $(item);

    const channel = [
      content.find("h1").text().trim(),
      content.find("a:first-of-type").attr("href"),
      content.find("a:last-of-type").attr("href")
    ];

    if (channel.every((prop) => typeof prop === "string")) {
      channels.push({
        name: channel[0]!,
        url: channel[1]!.slice(0, channel[1]!.lastIndexOf(".")),
        streamURL: channel[2]!
      });
    }
  });

  if (channels.length === 0) {
    throw new Error(`No channels found on ${sourceILoveMusic}; the site has probably updated`);
  }

  return channels;
}
