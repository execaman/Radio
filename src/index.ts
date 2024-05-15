import * as Discord from "discord.js";
import * as Voice from "@discordjs/voice";
import * as config from "./config.js";
import axios from "axios";
import { Queue } from "./queue.js";
import { fetchRadioChannels } from "./radio.js";

const client = new Discord.Client({
  intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildVoiceStates],
  partials: [
    Discord.Partials.Channel,
    Discord.Partials.GuildMember,
    Discord.Partials.GuildScheduledEvent,
    Discord.Partials.Message,
    Discord.Partials.Reaction,
    Discord.Partials.ThreadMember,
    Discord.Partials.User
  ],
  makeCache: Discord.Options.cacheWithLimits({
    AutoModerationRuleManager: 0,
    BaseGuildEmojiManager: 0,
    DMMessageManager: 0,
    GuildBanManager: 0,
    GuildEmojiManager: 0,
    GuildForumThreadManager: 0,
    GuildInviteManager: 0,
    GuildMemberManager: {
      maxSize: 1,
      keepOverLimit: (member) => member.id === member.client.user.id
    },
    GuildMessageManager: 0,
    GuildScheduledEventManager: 0,
    GuildStickerManager: 0,
    GuildTextThreadManager: 0,
    MessageManager: 0,
    PresenceManager: 0,
    ReactionManager: 0,
    ReactionUserManager: 0,
    StageInstanceManager: 0,
    ThreadManager: 0,
    ThreadMemberManager: 0,
    UserManager: 0
  }),
  presence: {
    activities: [
      {
        name: `v${Discord.version}`,
        type: Discord.ActivityType.Streaming,
        url: "https://twitch.tv/#"
      }
    ]
  }
});

const channels = new Queue(config.streamILoveMusic ? await fetchRadioChannels() : []);

if (
  config.otherRadioChannels.some(
    (channel) =>
      typeof channel.name !== "string" ||
      typeof channel.url !== "string" ||
      typeof channel.streamURL !== "string"
  )
) {
  throw new Error("One of your custom radio channels is missing appropriate or required info");
}

channels.items.push(...config.otherRadioChannels);

if (channels.items.length === 0) {
  throw new Error(
    "No channels to stream from, either add custom channels or turn on 'streamILoveMusic' from config"
  );
}

const player = Voice.createAudioPlayer({
  behaviors: {
    noSubscriber: Voice.NoSubscriberBehavior.Play
  }
});

const playAudioChannel = async (streamURL: string) => {
  if (player.state.status !== Voice.AudioPlayerStatus.Idle) player.stop(true);

  try {
    player.play(
      Voice.createAudioResource((await axios.get(streamURL, { responseType: "stream" })).data)
    );
  } catch {
    player.emit("error");
  }
};

player.on("error", async () => {
  console.log(`[stream] Failed to play ${channels.currentItem!.name} ${channels.currentItem!.url}`);

  await playAudioChannel(
    channels.next ? channels.nextItem!.streamURL : channels.currentItem!.streamURL
  );
});

player.on("stateChange", async (previous, current) => {
  if (current.status !== Voice.AudioPlayerStatus.Idle) return;
  await playAudioChannel(channels.currentItem!.streamURL);
});

const joinVoiceChannel = async (voiceChannel?: Discord.VoiceChannel) => {
  const channel = voiceChannel || (await client.channels.fetch(config.voiceChannelId));

  if (!channel || channel.type !== Discord.ChannelType.GuildVoice || !channel.joinable) {
    throw new Error(
      !channel ? "Channel not found. Is the bot in your server with proper permissions?"
      : channel.type !== Discord.ChannelType.GuildVoice ?
        "Channel should be a general voice (not stage) channel"
      : "The bot does not have permission to join said voice channel"
    );
  }

  const connection = Voice.joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guildId,
    adapterCreator: channel.guild.voiceAdapterCreator
  });

  connection.on("error", console.error.bind(null, "[voice]"));
  connection.on("stateChange", async (previous, current) => {
    if (
      current.status === Voice.VoiceConnectionStatus.Destroyed ||
      current.status === Voice.VoiceConnectionStatus.Disconnected
    ) {
      connection.removeAllListeners();
      await joinVoiceChannel();
    }
  });

  connection.subscribe(player);
  return connection;
};

const radioSelectOptions = () => {
  return channels.items
    .slice(0, 75)
    .reduce<Discord.StringSelectMenuOptionBuilder[][]>((total, channel, index) => {
      const option = new Discord.StringSelectMenuOptionBuilder()
        .setLabel(channel.name.slice(0, 99))
        .setValue(index.toString())
        .setDefault(index === channels.index);

      if (index % 25 === 0) total.push([option]);
      else total.at(-1)!.push(option);

      return total;
    }, []);
};

const radioComponents = (): (
  | Discord.ActionRowBuilder<Discord.StringSelectMenuBuilder>
  | Discord.ActionRowBuilder<Discord.ButtonBuilder>
)[] => {
  return [
    ...radioSelectOptions().map((options, index) =>
      new Discord.ActionRowBuilder<Discord.StringSelectMenuBuilder>().setComponents(
        new Discord.StringSelectMenuBuilder()
          .setCustomId(`radio_select_${index}`)
          .setPlaceholder(`Radio Channels ${index + 1}`)
          .setOptions(options)
      )
    ),

    new Discord.ActionRowBuilder<Discord.ButtonBuilder>().setComponents(
      new Discord.ButtonBuilder()
        .setCustomId("firstItem")
        .setStyle(Discord.ButtonStyle.Success)
        .setLabel("First")
        .setDisabled(channels.index === 0),

      new Discord.ButtonBuilder()
        .setCustomId("previousItem")
        .setStyle(Discord.ButtonStyle.Success)
        .setLabel("Previous")
        .setDisabled(!channels.previous),

      new Discord.ButtonBuilder()
        .setCustomId("randomItem")
        .setStyle(Discord.ButtonStyle.Success)
        .setLabel("Random"),

      new Discord.ButtonBuilder()
        .setCustomId("nextItem")
        .setStyle(Discord.ButtonStyle.Success)
        .setLabel("Next")
        .setDisabled(!channels.next)
    ),

    new Discord.ActionRowBuilder<Discord.ButtonBuilder>().setComponents(
      new Discord.ButtonBuilder()
        .setCustomId("lastItem")
        .setStyle(Discord.ButtonStyle.Success)
        .setLabel("Last")
        .setDisabled(channels.index === channels.items.length - 1),

      new Discord.ButtonBuilder()
        .setStyle(Discord.ButtonStyle.Link)
        .setLabel(channels.currentItem!.name.slice(0, 99))
        .setURL(channels.currentItem!.url)
    )
  ];
};

client.once(Discord.Events.ClientReady, async () => {
  if (!client.isReady()) return;

  client.application = await client.application!.fetch();

  if ("username" in client.application.owner!) {
    config.broadcasters.add(client.application.owner!.id);
  } else {
    client.application.owner!.members.forEach((member, id) => {
      config.broadcasters.add(id);
    });
  }

  const voiceChannel = (await client.channels.fetch(config.voiceChannelId)) as Discord.VoiceChannel;

  const textChannel =
    typeof config.textChannelId === "string" && config.textChannelId.length > 0 ?
      ((await client.channels.fetch(config.textChannelId)) as Discord.GuildTextBasedChannel)
    : voiceChannel;

  const message = (await textChannel.messages.fetch({ limit: 1, cache: false })).first();

  if (!message || message.author.id !== client.user.id) {
    if (textChannel.permissionsFor(client.user.id)?.has(Discord.PermissionFlagsBits.SendMessages)) {
      await textChannel.send({
        components: radioComponents()
      });
    } else {
      console.log("[message] Can't send messages in said voice channel");
    }
  }

  await joinVoiceChannel(voiceChannel);
  await playAudioChannel(channels.currentItem!.streamURL);
});

client.on(Discord.Events.InteractionCreate, async (interaction) => {
  if (!config.broadcasters.has(interaction.user.id)) {
    if (interaction.isRepliable()) {
      await interaction.reply({
        content: "You're not allowed to interact with these controls"
      });
    }
    return;
  }

  if (interaction.isButton()) {
    const action = interaction.customId as
      | "firstItem"
      | "previousItem"
      | "randomItem"
      | "nextItem"
      | "lastItem";

    await interaction.deferUpdate();

    await playAudioChannel(channels[action]!.streamURL);

    await interaction.editReply({ components: radioComponents() });
  } else if (interaction.isStringSelectMenu()) {
    channels.index = parseInt(interaction.values[0]!);

    await interaction.deferUpdate();

    await playAudioChannel(channels.currentItem!.streamURL);
    await interaction.editReply({ components: radioComponents() });
  }
});

for (const event of ["beforeExit", "SIGINT", "SIGHUP"]) {
  process.once(event, async () => {
    if (client.isReady()) await client.destroy();
    process.exit(0);
  });
}

client.login(config.botToken);
