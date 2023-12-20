interface Stream {
  name: string; // stream name
  link: string; // stream page
  url: string; // stream url
}
export type { Stream };

export const channelId = ""; // guild voice channel id
export const token = ""; // discord bot token
export const ilovemusic = true; // whether to include channels from ilovemusic.de

export const streams: Stream[] = []; // add stream objects inside
