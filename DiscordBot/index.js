const Discord = require("./commandHandler.js");
const fs = require("fs");
let Client = new Discord.Client({
    prefix: "!", color: "AAAAAA", footer: "JCRP Verification Bot"});
let files = fs.readdirSync("./plugins");
for (let x = 0; x < files.length; x++) {
	require(`./plugins/${files[x]}`).load(Client);
}


Client.login("DiscordTokenGoesHere").catch(console.log);