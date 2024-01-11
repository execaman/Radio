<div align="center">
  <img width="150px" src="./avatar.png"/>
</div>

## Radio

This is a reliable 24/7 discord bot that streams from [ilovemusic.de](https://ilovemusic.de/streams/) by default, including any supported direct stream links you provide manually. If you use a service like centova, shoutcast, or icecast and the stream doesn't work, try configuring your stream or using a different streaming format.

### Pros

- Low memory consumption
- Ability to re-connect and stream last url
- Easy stream-switch control from voice chat

### Cons

- Not meant to be fully customizable
- Cannot have more than 75 streams in total
- Support restricted to [GuildVoice](https://discord.js.org/docs/packages/discord.js/main/VoiceChannel:Class) channel only</li>

## Configuration

- Configure the bot from [`./src/config.mts`](./src/config.mts) or [`./lib/config.mjs`](./lib/config.mjs)

- If you're familiar with ts, go for it, simple js in esm is available otherwise.

- If you have your own streaming source(s) and don't want ilovemusic channels, simply set `ilovemusic` to false.

- You can add id of users in config to restrict stream-switch access to admins/mods only.
