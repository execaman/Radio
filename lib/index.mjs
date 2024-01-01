import Discord from "discord.js";
import * as Voice from "@discordjs/voice";
import * as config from "./config.mjs";
import stream from "./stream.mjs";
import Queue from "./queue.mjs";
const client = new Discord.Client({
    intents: [Discord.GatewayIntentBits.GuildVoiceStates],
    partials: [
        Discord.Partials.Channel,
        Discord.Partials.GuildMember,
        Discord.Partials.GuildScheduledEvent,
        Discord.Partials.Message,
        Discord.Partials.Reaction,
        Discord.Partials.ThreadMember,
        Discord.Partials.User,
    ],
    makeCache: Discord.Options.cacheWithLimits({
        ApplicationCommandManager: 0,
        AutoModerationRuleManager: 0,
        BaseGuildEmojiManager: 0,
        DMMessageManager: 0,
        GuildBanManager: 0,
        GuildEmojiManager: 0,
        GuildForumThreadManager: 0,
        GuildInviteManager: 0,
        GuildMemberManager: 0,
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
        UserManager: 0,
    }),
    presence: {
        activities: [
            {
                name: `v${Voice.version}`,
                type: Discord.ActivityType.Streaming,
                // youtube or twitch url
                // if you have something
                // to feature in bot status
                url: "https://twitch.tv/#",
            },
        ],
    },
});
const streams = new Queue(config.ilovemusic ? await stream() : []);
streams.data.push(...config.streams);
if (streams.data.length === 0)
    throw new Error("No stream links to stream from, please add a stream in config.mjs or set ilovemusic to true");
const components = () => [
    ...streams.data
        .reduce((options, stream, index) => {
        const option = new Discord.StringSelectMenuOptionBuilder()
            .setLabel(stream.name)
            .setValue(index.toString());
        if (index === streams.index)
            option.setDefault(true);
        if (options.at(-1).length < 25)
            options.at(-1).push(option);
        else
            options.push([option]);
        return options;
    }, [[]])
        .map((option, index) => new Discord.ActionRowBuilder().addComponents(new Discord.StringSelectMenuBuilder()
        .setCustomId(`option_${index}`)
        .setOptions(option)))
        .slice(0, 3),
    new Discord.ActionRowBuilder().addComponents(new Discord.ButtonBuilder()
        .setCustomId("firstItem")
        .setStyle(Discord.ButtonStyle.Success)
        .setLabel("First")
        .setDisabled(!streams.previous), new Discord.ButtonBuilder()
        .setCustomId("previousItem")
        .setStyle(Discord.ButtonStyle.Success)
        .setLabel("Previous")
        .setDisabled(!streams.previous), new Discord.ButtonBuilder()
        .setCustomId("randomItem")
        .setStyle(Discord.ButtonStyle.Success)
        .setLabel("Random"), new Discord.ButtonBuilder()
        .setCustomId("nextItem")
        .setStyle(Discord.ButtonStyle.Success)
        .setLabel("Next")
        .setDisabled(!streams.next)),
    new Discord.ActionRowBuilder().addComponents(new Discord.ButtonBuilder()
        .setCustomId("lastItem")
        .setStyle(Discord.ButtonStyle.Success)
        .setLabel("Last")
        .setDisabled(!streams.next), new Discord.ButtonBuilder()
        .setStyle(Discord.ButtonStyle.Link)
        .setLabel(streams.currentItem.name)
        .setURL(streams.currentItem.link)),
];
const player = Voice.createAudioPlayer({
    behaviors: {
        noSubscriber: Voice.NoSubscriberBehavior.Stop,
    },
})
    .on("error", console.error)
    .on("stateChange", (previous, current) => {
    if (current.status !== Voice.AudioPlayerStatus.Idle)
        return;
    player.play(Voice.createAudioResource(streams.currentItem.url));
});
const joinVoiceChannel = async () => {
    const channel = await client.channels.fetch(config.channelId);
    if (!channel || channel.type !== Discord.ChannelType.GuildVoice)
        throw new Error("Not a valid voice channel");
    Voice.joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guildId,
        adapterCreator: channel.guild.voiceAdapterCreator,
    })
        .on("error", console.error)
        .on("stateChange", async (previous, current) => {
        if (![
            Voice.VoiceConnectionStatus.Destroyed,
            Voice.VoiceConnectionStatus.Disconnected,
        ].includes(current.status))
            return;
        await joinVoiceChannel();
    })
        .subscribe(player);
};
client.once(Discord.Events.ClientReady, async () => {
    client.on(Discord.Events.Debug, async (message) => {
        console.log(message);
        if (client.isReady())
            return;
        await client.destroy();
        process.kill(1);
    });
    const channel = await client.channels.fetch(config.channelId);
    if (!channel || channel.type !== Discord.ChannelType.GuildVoice)
        throw new Error("Not a valid voice channel");
    const message = (await channel.messages.fetch({ limit: 1, cache: false })).first();
    if (!message || message.author.id !== client.user.id)
        await channel.send({ components: components() });
    else
        await message.edit({
            content: "",
            embeds: [],
            components: components(),
        });
    await joinVoiceChannel();
    player.play(Voice.createAudioResource(streams.currentItem.url));
});
client.on(Discord.Events.InteractionCreate, async (i) => {
    if (!i.member.roles.cache.hasAny(...config.roles))
        return;
    player.stop(true);
    await i.deferUpdate();
    player.play(Voice.createAudioResource(i.isButton()
        ? streams[i.customId].url
        : streams.jump(Number(i.values[0])).url));
    await i.editReply({ components: components() });
});
client.login(config.token);
