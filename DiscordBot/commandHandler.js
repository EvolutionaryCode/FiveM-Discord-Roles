const discord = require("discord.js");
const fs = require("fs");
const util = require("./util");

hasOneOf = function(mapp, arr) {
	for(let i = 0; i < arr.length; i++) {
		if (mapp.has(arr[i])) {
			return true;
		}
	}
	return false;
}

includesOneOf = function(str, arr) {
	for(let i = 0; i < arr.length; i++) {	
		if (str.includes(arr[i])) {
			return true;
		}
	}
	return false;
}

oneOfHas = function(objectOfMaps, str) {
	let keys = Object.keys(objectOfMaps);
	for (let i = 0; i < keys.length; i++) {
		if (objectOfMaps[keys[i]].has(str)){
			return objectOfMaps[keys[i]];
		}
	}
	return false;
	
}

class commandHandler extends discord.Client {
	constructor(options={}) {
		super();
		this.on("message", message => this.handle(message));
		this.on("ready", () => console.log("ready"));
		this.registry = {};
		//if (!fs.existsSync("./config.json")) { 
		//	util.writeJSONSync("./config.json", {prefix:".", color:"AAAAAA", footer:"Evolutionarycode 2018"});
		//}
		if (!fs.existsSync("./guilds.json")) { 
			util.writeJSONSync("./guilds.json", {});
		}
		//this.config = util.openJSONSync("./config.json");
		this.config = {}
		this.guildConfigs = util.openJSONSync("./guilds.json");
		let iterate = Object.keys(options);
		for (let i = 0; i < iterate.length; i++) {
			this.config[iterate[i]] = options[iterate[i]];
		}
		//util.writeJSON("./config.json", this.config);
		this.registry["Main"] = new discord.Collection();
		this.registry["Main"].set("help", new help());
		this.addCommand("Management", new setRoles());
	}
	handle(message) {
		if (message.content.startsWith(this.config.prefix)) {
			//console.log(message.content);
			message.content = message.content.slice(this.config.prefix.length, message.content.length);
			if (message.channel.type != "dm" && !Object.keys(this.guildConfigs).includes(message.guild.id)) {
				this.guildConfigs[message.guild.id] = {};
			}
			for (let i = 0; i < Object.keys(this.registry).length; i++) {
				if (!this.guildConfigs[message.guild.id][Object.keys(this.registry)[i]]) {
					this.guildConfigs[message.guild.id][Object.keys(this.registry)[i]] = {}
				}
					
				this.registry[Object.keys(this.registry)[i]].forEach(command => {
					if (!Object.keys(this.guildConfigs[message.guild.id][Object.keys(this.registry)[i]]).includes(command.name)) {
						this.guildConfigs[message.guild.id][Object.keys(this.registry)[i]][command.name] = ["@everyone"];
						util.writeJSONSync("./guilds.json", this.guildConfigs);
					}
					let content = message.content.split(" ");
					//console.log(this.guildConfigs[message.guild.id][command.name]);
					if (command.aliases.includes(content[0].toLowerCase()) && (message.guild.owner.id == message.author.id || hasOneOf(message.member.roles, this.guildConfigs[message.guild.id][Object.keys(this.registry)[i]][command.name]) || this.guildConfigs[message.guild.id][Object.keys(this.registry)[i]][command.name].includes("@everyone"))){
						content.shift();
						command.message(content.join(" "), message.author, message.channel, message.guild, message, this);
					}
				});
			}
		}
	}
	addCommand(group, command=new Command()) {
		if (!this.registry[group]) {
			this.registry[group] = new discord.Collection();
		}
		this.registry[group].set(command.name, command);
	}
	sendError(channel, error) {
		console.log(error);

		channel.send({embed:new discord.RichEmbed().setTitle("Error").setDescription(error).setFooter(this.config.footer).setColor(this.color).setTimestamp()});
	}
	newEmbed() {
		return new discord.RichEmbed().setColor(this.config.color).setFooter(this.config.footer).setTimestamp();
	}
}



class Command {
	constructor(name="", aliases=[], usage="", description="") {
		this.name=name;
		this.aliases=aliases;
		this.usage=usage;
		this.description=description;
	}
	message(content, author, channel, guild, message, handler) {
		console.log(content);
	}
}

class help extends Command {
	constructor() {
		super("help", ["help", "?"], "help [command]", "helps");
	}
	message(content, author, channel, guild, message, handler) {
		console.log(oneOfHas(handler.registry, content.split(" ")[0]));
		if (!oneOfHas(handler.registry, content.split(" ")[0])) {
			let sending = new discord.RichEmbed().setColor(handler.config.color).setTitle("Help").setDescription("\u200b").setFooter(handler.config.footer).setTimestamp().setThumbnail(guild.iconURL);
			for (let i = 0; i < Object.keys(handler.registry).length; i++) {
				let desc = [];
				handler.registry[Object.keys(handler.registry)[i]].forEach(command => {
					desc.push(command.name);
				});
				sending.addField(Object.keys(handler.registry)[i], desc.join("\n"), false);
			}
			channel.send({embed:sending});
		} else {
			let sending = new discord.RichEmbed().setColor(handler.config.color).setFooter(handler.config.footer).setTimestamp();
			let command = oneOfHas(handler.registry, content.split(" ")[0]).get(content.split(" ")[0]);
			sending.setDescription(command.description).setTitle(`Help: ${command.name}`).addField("Usage: ", command.usage, false).addField("Aliases:", command.aliases.join(", "), false).addField("Allowed Roles", handler.guildConfigs[message.guild.id][command.name] == [] ? handler.guildConfigs[message.guild.id][command.name].join("> <@&")+">" : "none", false);
			channel.send({embed:sending});
		}
	}
}

class setRoles extends Command {
	constructor() {
		super("setroles", ["setroles" ,"roles", "limitroles"], "roles <group.command> <@\u200brole> [@role or role.id]", "limit command to certain roles");
	}
	message(content, author, channel, guild, message, handler) {
		console.log(content.split(" "));
		if (oneOfHas(handler.registry, content.split(" ")[0]) != false) {
			let command = handler.registry.get(content.split(" ")[0]);
			if (!Object.keys(handler.guildConfigs[message.guild.id]).includes(command.name)) {
				handler.guildConfigs[message.guild.id][command.name] = [];
				util.writeJSON("./guilds.json", handler.guildConfigs);
			}
			console.log(content)
			content.replace("<@&", "");
			content.replace(">", "");
			content = content.split(" ");
			content.shift();
			console.log(content);
			handler.guildConfigs[guild.id][command.name] = content;
			util.writeJSON("./guilds.json", handler.guildConfigs);
		}
	}
}
//exports = discord;
exports.Client = commandHandler;
exports.hasOneOf = hasOneOf;
exports.includesOneOf = includesOneOf;
exports.oneOfHas = oneOfHas;
//exports.registry = commandRegistry;
exports.Command = Command;
