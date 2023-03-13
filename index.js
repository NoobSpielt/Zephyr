const { Client, Intents, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, GatewayIntentBits, ActionRowBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
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
            .setStyle(TextInputStyle.Short);
        const repoActionRow = new ActionRowBuilder().addComponents(repoInput);
        const titleActionRow = new ActionRowBuilder().addComponents(titleInput);

        modal.addComponents(repoActionRow, titleActionRow);
        await interaction.showModal(modal);


    } else if (!interaction.isModalSubmit()) { return; }
    else if (interaction.customId === 'newissue') {
        const repoName = interaction.fields.getTextInputValue('repo');
        const issueTitle = interaction.fields.getTextInputValue('title');
        if (repoName && issueTitle) {
            try {
                const response = await createIssue(repoName, issueTitle, interaction.user.tag);
                const issueNumber = response.data.repository.full_name + "#" + response.data.number;

                await interaction.client.application.fetch();
                interaction.reply({ content: `Creating Issue...`, ephemeral: true }); // We need this so the form doesn't stay open

                const embed = new EmbedBuilder()
                    .setTitle(`Internal Issue ${issueNumber}`)
                    .setDescription(`The issue has been created for ${interaction.user.tag}.`)
                    .setColor('#008000')
                    .setFooter({ text: `Created by ${interaction.client.application.owner.tag}` });
                await message.reply({ embeds: [embed] });
            } catch (error) {
                console.error(error);
                await interaction.reply('An error occurred while creating the issue.');
            }
        } else {
            await interaction.reply('You must provide a repo name and issue title to create an issue.');
        }
    }
});

async function createIssue(repoName, issueTitle, UserTag) {


    if (repoName === 'copnet' || repoName === 'medicnet' || repoName === 'carnet' || repoName === 'firenet') {
        repoName = 'wgc/' + repoName + '.li';
    }
    else if (repoName === 'tablet') {
        repoName = 'wgc/VPC-Connector-FiveM';
    }
    else {
        repoName = null;
    }

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


client.login(process.env.BOT_TOKEN);