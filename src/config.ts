import { ActivityType } from "discord.js";
import { version } from "@discordjs/voice";

import type { RadioChannel } from "./radio.js";
import type { ActivitiesOptions } from "discord.js";

/**
 * Discord Bot Token. To know how to create and get your bot's token
 * visit https://discordjs.guide/preparations/setting-up-a-bot-application.html
 */
export const botToken = "";

/**
 * Set the bot's activity (status)
 */
export const activity: ActivitiesOptions = {
  name: `v${version}`, // status text
  type: ActivityType.Streaming, // status type: https://discord-api-types.dev/api/discord-api-types-v10/enum/ActivityType
  url: "https://twitch.tv/#" // twitch or youtube url (only for streaming type)
};

/**
 * Server general voice (not stage) channel id
 */
export const voiceChannelId = "";

/**
 * Any text channel id to send the radio
 * player controls managed by buttons
 * leaving this empty would send it in voice channel
 */
export const textChannelId = "";

/**
 * Discord user id's of people who can switch
 * between radio channels by using buttons on
 * the message sent in voice/text channel, example:
 *
 * export const broadcasters: string[] = new Set<string>(["0123456789", "8164826194"]);
 *
 * Note: owners and team members (if any) of the bot are added automatically due ownership
 */
export const broadcasters = new Set<string>([]);

/**
 * Set 'streamILoveMusic' to 'true' for streaming
 * from 'sourceILoveMusic'; 'false' otherwise to
 * avoid streaming channels from ilovemusic.de
 */
export const streamILoveMusic = true;
export const sourceILoveMusic = "https://ilovemusic.de/streams/";

/**
 * Custom radio channels go here, example:
 *
 * export const otherRadioChannels: RadioChannel[] = [
 *   {
 *     name: "Channel Name",
 *     url: "URL to a webpage for this channel", // [optional]
 *     streamURL: "The url from which this channel can be streamed"
 *   }
 * ];
 *
 * You can add multiple channels by separating every channel '{...}' by a comma:
 *
 * export const otherRadioChannels: RadioChannel[] = [
 *   {
 *     name: "Channel 1",
 *     url: "channel 1 webpage url", // [optional]
 *     streamURL: "channel 1 stream url"
 *   },
 *   {
 *     name: "Channel 2",
 *     url: "channel 2 webpage url", // [optional]
 *     streamURL: "channel 2 stream url"
 *   }
 * ];
 */
export const otherRadioChannels: RadioChannel[] = [];
