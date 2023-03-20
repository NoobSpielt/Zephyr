const { Client, Intents, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, GatewayIntentBits, ActionRowBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates] });
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.application.commands.create({
        name: 'create-issue',
        type: 3
    });
});


client.on('interactionCreate', async (interaction) => {

    if (interaction.commandName === 'create-issue') {


        // check if the interacting member has a role with one of the allowed group IDs
        const roles = process.env.ACCES_GROUPS.split(',');

        const hasAllowedRole = interaction.member.roles.cache.some(r => roles.includes(r.id));
        // Restrict Acces to some group. We don't want indefinite git issues, do we?. Maybe we should even restrict some group from using it even if they have the role.
        if (!hasAllowedRole) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        message = interaction.targetMessage;
        imageUrls = message.attachments.filter(attachment => attachment.contentType.startsWith('image')).map(attachment => attachment.url);
        author = message.author.tag;


        const modal = new ModalBuilder()
            .setCustomId('newissue')
            .setTitle('Create Issue');
        const repoInput = new TextInputBuilder()
            .setCustomId('repo')
            .setLabel("What is the name of the Repo?")
            .setStyle(TextInputStyle.Short);
        const titleInput = new TextInputBuilder()
            .setCustomId('title')
            .setLabel("What should be the title of the issue?")
            .setStyle(TextInputStyle.Short)
            .setRequired(false);
        const oldIssueNumber = new TextInputBuilder()
            .setCustomId('oldIssueNumber')
            .setLabel("Existing Issue Number")
            .setStyle(TextInputStyle.Short)
            .setRequired(false);
        const repoActionRow = new ActionRowBuilder().addComponents(repoInput);
        const oldIssueNumberActionRow = new ActionRowBuilder().addComponents(oldIssueNumber);
        const titleActionRow = new ActionRowBuilder().addComponents(titleInput);

        modal.addComponents(repoActionRow, titleActionRow, oldIssueNumberActionRow);
        await interaction.showModal(modal);


    } else if (!interaction.isModalSubmit()) { return; }
    else if (interaction.customId === 'newissue') {
        repoName = interaction.fields.getTextInputValue('repo');
        const issueTitle = interaction.fields.getTextInputValue('title');
        const oldIssueNumber = interaction.fields.getTextInputValue('oldIssueNumber');
        if (repoName && issueTitle || reponame && oldIssueNumber) {

            if (repoName === 'copnet' || repoName === 'medicnet' || repoName === 'carnet' || repoName === 'firenet') {
                repoName = 'wgc/' + repoName + '.li';
            }
            else if (repoName === 'tablet') {
                repoName = 'wgc/VPC-Connector-FiveM';
            }
            else {
                repoName = null;
            }

            try {
                if (oldIssueNumber) {
                const response = await createIssue(repoName, issueTitle, interaction.user.tag, oldIssueNumber);

                const issueNumber = repoName + "#" + oldIssueNumber;

                await interaction.client.application.fetch();
                interaction.reply({ content: `Creating Follow Up...`, ephemeral: true }); // We need this so the form doesn't stay open

                const embed = new EmbedBuilder()
                    .setTitle(`Internal Issue ${issueNumber}`)
                    .setDescription(`Added Follow Up for: ${interaction.user.tag}.`)
                    .setColor('#008000')
                    .setFooter({ text: `Bot created by ${interaction.client.application.owner.tag}` });
                await message.reply({ embeds: [embed] });

                } else {
                    const response = await createIssue(repoName, issueTitle, interaction.user.tag, oldIssueNumber);
                    const issueNumber = response.data.repository.full_name + "#" + response.data.number;
    
                    await interaction.client.application.fetch();
                    interaction.reply({ content: `Creating Issue...`, ephemeral: true }); // We need this so the form doesn't stay open
    
                    const embed = new EmbedBuilder()
                        .setTitle(`Internal Issue ${issueNumber}`)
                        .setDescription(`The issue has been created for ${interaction.user.tag}.`)
                        .setColor('#008000')
                        .setFooter({ text: `Bot created by ${interaction.client.application.owner.tag}` });
                    await message.reply({ embeds: [embed] });
    
                }
            } catch (error) {
                console.error(error);
                await interaction.reply('An error occurred while creating the issue.');
            }
        } else {
            await interaction.reply('You must provide repo name and title, or reponame and an existing issue number.');
        }
    }
});

async function createIssue(repoName, issueTitle, UserTag, oldIssueNumber) {

    if (oldIssueNumber) {
        const url = `${process.env.GITEA_HOST}/api/v1/repos/${repoName}/issues/${oldIssueNumber}/comments`;
        const messageContent = message.content;

        let body = `**Follow up message:** ${messageContent}`;
        if (imageUrls.length > 0) {
            body += ` <br /><br />`;
            for (const imageUrl of imageUrls) {
                body += `<img src="${imageUrl}" alt="Image" />`;
            }
        }
        body += `<br /><br /> **Link:** ${message.url} \n **Message from:** ${author} \n**Created by:** ${UserTag}`;

        const data = {
            title: issueTitle,
            body,
        };

        const config = {
            headers: {
                Authorization: `token ${process.env.GITEA_TOKEN}`,
                'Content-Type': 'application/json',
            },
        };
        return axios.post(url, data, config);

    } else {
        const url = `${process.env.GITEA_HOST}/api/v1/repos/${repoName}/issues`;
        const messageContent = message.content;

        let body = `**Message:** ${messageContent}`;
        if (imageUrls.length > 0) {
            body += ` <br /><br />`;
            for (const imageUrl of imageUrls) {
                body += `<img src="${imageUrl}" alt="Image" />`;
            }
        }
        body += `<br /><br /> **Link:** ${message.url} \n **Message from:** ${author} \n**Created by:** ${UserTag}`;

        const data = {
            title: issueTitle,
            body,
        };

        const config = {
            headers: {
                Authorization: `token ${process.env.GITEA_TOKEN}`,
                'Content-Type': 'application/json',
            },
        };

        return axios.post(url, data, config);
    }

}

client.on('voiceStateUpdate', async (oldState, newState) => {
    // Load the monitored channel IDs from the .env file
    const monitoredChannelIDs = process.env.MONITORED_CHANNELS.split(',');

    // Load the role IDs to mention from the .env file
    const roleIDsToMention = process.env.MENTION_ROLES.split(',');

    // Check if the user joined one of the monitored channels
    if (monitoredChannelIDs.includes(newState.channelId) && oldState.channelId !== newState.channelId) {
        const user = newState.member.user;
        const joinedChannel = await newState.guild.channels.fetch(newState.channelId);
        const textChannel = await newState.guild.channels.fetch(process.env.TEXT_CHANNEL_ID);
        const roleMentions = roleIDsToMention.map(id => `<@&${id}>`).join(' ');
        // Send a message mentioning the roles and the channel name in the specified text channel
        const embed = new EmbedBuilder()

            .setTitle('User Joined Monitored Channel')
            .setDescription(`${user} has joined the monitored channel ${joinedChannel.name}!`)
            .setColor('#0099ff')
            .setTimestamp()
          //  .setFooter({ text: `Bot created by ${interaction.client.application.owner.tag}` }) 
        ;
        textChannel.send({ content: `Attention: ${roleMentions}`, embeds: [embed] });

}
});

client.login(process.env.BOT_TOKEN);