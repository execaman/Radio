<div align="center">
  <img width="150px" src="./avatar.png"/>
</div>

## Radio

A reliable 24/7 discord bot that streams from [ilovemusic.de](https://ilovemusic.de/streams/) by default, including any supported direct stream links you provide manually. If you use a service like centova, shoutcast, or icecast and the stream doesn't work, try configuring your stream or using a different streaming format.

## Features

- Radio player controlled by buttons
- Controls can be restricted to broadcasters
- Auto-join (or reconnect) to voice channel
- Autoplay next stream if current stream errors

## Drawbacks

By convention, for a community that just wants a 24/7 radio, the following limits apply:

- Not meant to be fully customizable
- Support restricted to [GuildVoice](https://discord.js.org/docs/packages/discord.js/main/VoiceChannel:Class) channel only
- Cannot have more than 75 streams (inclusive of ilovemusic streams if enabled)

## Requirements

- [Node.js](https://nodejs.org/en/download) v18 or above
- Minimum 256MB of RAM

## Configuration

The bot can be easily configured from the [config.ts](./src/config.ts) file. If you are about to host it on a vps that supports starting from a bash file you can use the [start.sh](./start.sh) file. If not, you need to run the following commands:

- `npm install` - to install necessary dependencies
- `npm start` - to start the bot

If you get any errors related to `@discordjs/opus` or `zlib-sync`, follow the steps in this [node-gyp](https://github.com/nodejs/node-gyp) repository for your system, delete `node_modules` and `package-lock.json` file, reinstall nodejs and run the commands above again to fix it.
