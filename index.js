require("dotenv").config();

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { title, description } = require("./settings.json");

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

const TIME_CHECK_IN_MINUTES = parseInt(process.env.TIME_CHECK_IN_MINUTES);
const NUMBER_OF_MESSAGES = parseInt(process.env.NUMBER_OF_MESSAGES);
const CHANNEL_ID = process.env.CHANNEL_ID;
const GUILD_ID = process.env.GUILD_ID;

let ourPriorMessage;

let messageCount = 0;

// to add additional fields, see https://discordjs.guide/popular-topics/embeds.html#embed-preview
async function PostMessage(channel) {
    let embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(title)
        .setDescription(description);

    return await channel.send({ embeds: [embed] });
}

async function repost(channel) {
    messageCount = 0;
    try {
        if (ourPriorMessage) await channel.messages.delete(ourPriorMessage);
    } catch (err) {
        console.log(`Something errored when deleting the old message: ${err.message}`);
    }
    const newMessage = await PostMessage(channel);
    ourPriorMessage = newMessage.id;
}

async function checkMessages() {
    const guild = await client.guilds.fetch(GUILD_ID);
    const channel = await guild.channels.fetch(CHANNEL_ID);
    const lastMessage = await channel.messages.fetch({ limit: 1 });

    if (lastMessage.first().author.id !== client.user.id) {
        await repost(channel);
    }
}

client.on("messageCreate", async (message) => {
    if (message.channel.id === CHANNEL_ID) {
        if (message.author.id !== client.user.id) messageCount++;
        if (messageCount >= NUMBER_OF_MESSAGES) await repost(message.channel);
    }
});

setInterval(checkMessages, TIME_CHECK_IN_MINUTES * 60 * 1000);

client.on("ready", async () => {
    await checkMessages();
});

client.login(process.env.TOKEN);