import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  MessageCreateOptions,
  MessageEditOptions,
  MessageFlags,
  StageChannel,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder
} from "discord.js";
import {
  activity,
  botToken,
  broadcasters,
  nonBroadcastingMemberNotice,
  otherRadioChannels,
  streamILoveMusic,
  textChannelId,
  voiceChannelId
} from "./config";
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionState,
  VoiceConnectionStatus
} from "@discordjs/voice";
import { Queue } from "./queue";
import { fetchRadioChannels } from "./radio";
import { inspect } from "node:util";
import axios from "axios";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  presence: { activities: [activity] }
});

const channels = new Queue(streamILoveMusic ? await fetchRadioChannels() : []);

if (Array.isArray(otherRadioChannels) && otherRadioChannels.length !== 0) {
  const nonEmptyString = (input: unknown): input is string => {
    return typeof input === "string" && input.length !== 0;
  };
  for (const channel of otherRadioChannels) {
    if (nonEmptyString(channel.name) && nonEmptyString(channel.streamURL)) {
      channels.items.push(channel);
    } else {
      console.log(`Invalid channel definition ${inspect(channel, { depth: -1 })}`);
    }
  }
}

if (channels.items.length === 0) {
  throw new Error("No channels to stream from; please add channels manually or enable 'streamILoveMusic' in config");
}

if (channels.items.length > 75) {
  throw new Error("Sorry, only a maximum of 75 radio channels is supported at the moment");
}

const player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Play
  }
});

const streamRadioChannel = async (streamURL = channels.currentItem!.streamURL) => {
  if (player.state.status !== AudioPlayerStatus.Idle) {
    player.stop(true);
  }
  try {
    const response = await axios.request({ method: "GET", url: streamURL, responseType: "stream" });
    player.play(createAudioResource(response.data));
    console.log(`[audio] :: Streaming ${streamURL}`);
  } catch {
    console.log(`Failed to play ${channels.currentItem!.name} ${channels.currentItem!.streamURL}`);
    streamRadioChannel(channels.nextItem?.streamURL ?? channels.firstItem!.streamURL);
  }
};

player.on("error", () => {
  streamRadioChannel();
});

const updateStageInstance = async (stageChannel?: StageChannel) => {
  const channel = stageChannel || client.channels.cache.get(voiceChannelId);
  if (!channel || channel.type !== ChannelType.GuildStageVoice) return;
  const topic = channels.currentItem!.name;
  try {
    await channel.guild.stageInstances.edit(channel, { topic });
  } catch {
    await channel.guild.stageInstances.create(channel, { topic });
  }
};

async function onStateChange(this: VoiceConnection, _previous: VoiceConnectionState, current: VoiceConnectionState) {
  switch (current.status) {
    case VoiceConnectionStatus.Ready: {
      const channel = client.channels.cache.get(voiceChannelId)!;
      console.log(`[voice] :: Connected to ${channel}`);
      if (channel.type === ChannelType.GuildStageVoice) {
        const voiceState = await channel.guild.voiceStates.fetch("@me");
        await voiceState.setSuppressed(false);
        await updateStageInstance(channel);
      }
      this.emit("connected");
      break;
    }

    case VoiceConnectionStatus.Disconnected: {
      if (this.rejoinAttempts !== 3) this.rejoin();
      else {
        const channel = client.channels.cache.get(voiceChannelId);
        this.emit("error", new Error(`Failed to rejoin ${channel} within 3 attempts`));
        this.removeAllListeners();
        this.destroy();
      }
      break;
    }
  }
}

const createVoiceConnection = async () => {
  const channel = client.channels.cache.get(voiceChannelId);

  if (!channel) {
    throw new Error("Voice channel not found");
  }
  if (!channel.isVoiceBased()) {
    throw new Error(`${channel} is not a voice based channel`);
  }
  if (!channel.joinable) {
    throw new Error(`Insufficient permissions to join ${channel}`);
  }

  const connection = joinVoiceChannel({
    adapterCreator: channel.guild.voiceAdapterCreator,
    channelId: channel.id,
    guildId: channel.guildId,
    selfDeaf: true,
    selfMute: false
  });

  connection.subscribe(player);
  connection.on("error", console.error);
  connection.on("stateChange", onStateChange);

  return new Promise((resolve) => {
    connection.once("connected", resolve);
  });
};

const playerControls = () => {
  const radioSelectOptions = channels.items.reduce<StringSelectMenuOptionBuilder[][]>((options, channel, index) => {
    const option = new StringSelectMenuOptionBuilder().setLabel(channel.name).setValue(index.toString());
    if (index === channels.index) option.setDefault(true);
    if (index % 25 === 0) options.push([option]);
    else options.at(-1)!.push(option);
    return options;
  }, []);

  const buttonRow1 = [
    new ButtonBuilder()
      .setCustomId("firstItem")
      .setStyle(ButtonStyle.Success)
      .setLabel("First")
      .setDisabled(channels.index === 0),

    new ButtonBuilder()
      .setCustomId("previousItem")
      .setStyle(ButtonStyle.Success)
      .setLabel("Previous")
      .setDisabled(!channels.previous),

    new ButtonBuilder().setCustomId("randomItem").setStyle(ButtonStyle.Success).setLabel("Random"),

    new ButtonBuilder()
      .setCustomId("nextItem")
      .setStyle(ButtonStyle.Success)
      .setLabel("Next")
      .setDisabled(!channels.next)
  ];

  const buttonRow2 = [
    new ButtonBuilder()
      .setCustomId("lastItem")
      .setStyle(ButtonStyle.Success)
      .setLabel("Last")
      .setDisabled(channels.index === channels.items.length - 1),

    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel(channels.currentItem!.url ? channels.currentItem!.name : "Channel WebPage Unavailable")
      .setURL(channels.currentItem!.url || "https://www.google.com/")
      .setDisabled(!channels.currentItem!.url)
  ];

  return {
    content: "",
    embeds: [],
    components: [
      ...radioSelectOptions.map((options, index) =>
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`radio_select_${index}`)
            .setPlaceholder(`Radio Channels ${index + 1}`)
            .addOptions(options)
        )
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(buttonRow1),
      new ActionRowBuilder<ButtonBuilder>().addComponents(buttonRow2)
    ]
  } satisfies MessageCreateOptions & MessageEditOptions;
};

client.once(Events.ClientReady, async () => {
  console.log(`[client] :: Logged in as ${client.user!.tag}`);

  client.application = await client.application!.fetch();

  if ("username" in client.application.owner!) {
    broadcasters.add(client.application.owner.id);
  } else {
    client.application.owner!.members.forEach((_member, id) => broadcasters.add(id));
  }

  await createVoiceConnection();

  const textChannel = client.channels.cache.get(textChannelId) ?? client.channels.cache.get(voiceChannelId)!;

  if (textChannel.isDMBased() || textChannel.isThread() || !textChannel.isSendable()) {
    throw new Error(`${textChannel} is not a text based channel`);
  }

  const message = (await textChannel.messages.fetch({ limit: 1 })).first();

  if (!message || message.system || message.author.id !== client.user!.id) {
    await textChannel.send(playerControls());
  } else {
    await message.edit(playerControls());
  }

  await streamRadioChannel();
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isRepliable()) return;

  if (!broadcasters.has(interaction.user.id)) {
    await interaction.reply({ content: nonBroadcastingMemberNotice, flags: [MessageFlags.Ephemeral] });
    return;
  }

  if (interaction.isButton()) {
    channels[interaction.customId as "firstItem" | "previousItem" | "randomItem" | "nextItem" | "lastItem"];
  } else if (interaction.isStringSelectMenu()) {
    channels.index = Number(interaction.values[0]);
  }

  await (interaction as ButtonInteraction | StringSelectMenuInteraction).update(playerControls());
  await updateStageInstance();
  await streamRadioChannel();
});

const onExit = async () => {
  await client.destroy();
  process.exit(0);
};

for (const exitEvent of ["beforeExit", "SIGINT", "SIGHUP"]) {
  process.on(exitEvent, onExit);
}

client.login(botToken);
