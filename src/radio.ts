import axios from "axios";
import { load } from "cheerio/slim";
import { sourceILoveMusic } from "./config.js";

export interface RadioChannel {
  name: string;
  url?: string;
  streamURL: string;
}

export const fetchRadioChannels = async () => {
  const response = await axios.request({ method: "GET", url: sourceILoveMusic }).catch(() => {
    throw new Error(`Couldn't get any response from '${sourceILoveMusic}'`);
  });

  const $ = load(response.data);
  const channels: RadioChannel[] = [];

  $("div.content:has(:any-link)").each((_index, item) => {
    const content = $(item);

    const name = content.find("h1").text().trim();
    const url = content.find("a:first-of-type").attr("href");
    const streamURL = content.find("a:last-of-type").attr("href");

    if (name.length !== 0 && typeof url === "string" && typeof streamURL === "string") {
      channels.push({ name, url, streamURL });
    }
  });

  if (channels.length === 0) {
    throw new Error(`No channels found on ${sourceILoveMusic}; the site has probably updated`);
  }
  return channels;
};
