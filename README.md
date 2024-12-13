<div align="center">
  <img width="150px" src="./assets/avatar.png"/>
</div>

## Radio

A reliable 24/7 discord bot that streams from [`ilovemusic.de`](https://ilovemusic.de/streams/) by default, including any supported direct stream links you provide manually.

If you use a service like centova, shoutcast, or icecast and the stream doesn't work, try re-configuring your stream or using a different streaming format.

## Requirements

- [`Node.js`](https://nodejs.org/en/download) v18.14.0 or above
- [`FFmpeg`](https://www.ffmpeg.org/download.html) (version depends on OS by compatibility, prefer latest)
- Minimum 256MB of RAM

Note: if you can't install ffmpeg, try static binaries from npm like [`ffmpeg-static`](https://www.npmjs.com/package/ffmpeg-static), [`@ffmpeg-installer/ffmpeg`](https://www.npmjs.com/package/@ffmpeg-installer/ffmpeg), etc. but keep in mind that they offer limited functionality.

## Features

- Player controls (button interactions)
- Controls can be restricted to broadcasters
- Auto-join (or reconnect) voice/stage channel
- Autoplay next radio channel on failure (like a playlist)

## Drawbacks

For a community that just wants a 24/7 radio, the following limits apply:

- Single voice/stage channel (cannot change when the bot is in operation)
- Cannot have more than 75 streams (inclusive of ilovemusic streams if enabled)
- Stage channels are also supported, but not recommended; also, the bot must be a stage moderator

## Configuration

The bot can be easily configured from the [`config.ts`](./src/config.ts) file. If you are about to host it on a vps that supports starting from a bash file you can use the [`start.sh`](./start.sh) file (note: you might have to modify these commands if your vps has certain restrictions). If not, you need to run the following commands in a shell:

- `npm install` - to install necessary dependencies
- `npm run build` - to build the bot
- `npm start` - to start the bot

If you get any errors mentioning `node-gyp`, follow the steps in this [`node-gyp`](https://github.com/nodejs/node-gyp) repository for your system, delete `node_modules` and `package-lock.json` file and run the above commands again.
