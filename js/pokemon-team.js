/* */

// create a new pokemon object to attribute different stats
function intantiatePokemonObj(){
	var pokemonObj = {
		name: "",
		nickname: "",
		types: "",
		stats: [],

		shiny: false,
		nature: "",
		level: 0,

		imageLink: ""
	};

	return pokemonObj;
}

function intantiateTeamObj(){
	var teamObj = {
		game: "",
		pokemon: [],

		playerName: "",
		playerGender: "",
		
		playthroughTime: "",
		dateOfFinish: "",
		
		tag: "",
		picture: "",

		randomID: 0
	};

	return teamObj;
}



// function which adds all necessary info to the TEAM obj, then returns the TEAM obj
function createPokemonTeamObj(inGame, inPokemon, inName, inGender, inTime, inDate, inTag, inPicture){
	team = intantiateTeamObj();
	team.game = inGame;

	team.pokemon = inPokemon;
	
	team.playerName = inName;
	team.playerGender = inGender;
	team.playthroughTime = inTime;
	team.dateOfFinish = inDate;
	team.tag = inTag;
	team.picture = inPicture; //document.getElementById("teamtag-input").value;
	team.randomID = generateRandomNumber(); // create a 'random' number which attaches to this teamObj, if deleted, we can reference this #

	return team;
}

// function which adds all necessary info to the POKEMON obj, then returns the POKEMON obj
function createPokemonObj(inName, inNickname, inTypes, inStats, inShiny, inNature, inLevel, inImgLink){
	pokemon = intantiatePokemonObj();

	pokemon.name = inName;
	pokemon.nickname = inNickname;

	// input types come as 'fire:flying', all code is handled with such string, unless it is needed to break up, in which case .split(':')
	pokemon.types = inTypes;

	pokemon.stats = inStats;
	pokemon.shiny = inShiny;
	pokemon.nature = inNature;
	pokemon.level = inLevel;
	pokemon.imageLink = inImgLink;

	return pokemon;
}

// this is done to the pokemon images AFTER the user accepts the team, thus being the easiest way to store the data
// in case the user removes a pokemon, alters its stats, etc.
function createPokemonArrayWithAltInfo(id) {
	var pokemonArray = [];

	// find each pokemon image element, extract the .alt, and add to the javascript 
	$("#" + id).children().each(function () {
		var $pokemonMainDiv = $(this).children();
		var $pokemonImageDiv = $(this).children(".pokemon-image");
		var stats = $pokemonImageDiv.attr("alt");
		var name = $pokemonImageDiv.attr("name");
		var imgLink = $pokemonImageDiv.attr("src");

		var pokemonInfoArray = parseStatsString(stats);
		var pokemonStatsArrayOnly = pokemonInfoArray.slice(0, 6); // obtain stats in array form

		// name, nickname, types, stats, shiny, nature, level, and image source
		var currentPokemon = createPokemonObj(pokemonInfoArray[7], pokemonInfoArray[11], pokemonInfoArray[8], pokemonStatsArrayOnly, pokemonInfoArray[9], pokemonInfoArray[6], pokemonInfoArray[10], imgLink);

		pokemonArray.push(currentPokemon);
	});
	

	return pokemonArray;
}

// function which takes an ID of a button, obtains its value (which is the randomID of the team, and deletes the team from the userObj
function deleteTeamObjFromUserObj(inputID) {
	var elementRandomID = parseInt(document.getElementById(inputID).value);

	for (var i = 0; i < thisUser.teams.length; i++){
		if (elementRandomID == thisUser.teams[i].randomID){
			thisUser.teams.splice(i, 1);
			return;
		}
		
	}

	alert("couldn't remove this row for some reason");
}

function generateRandomNumber(){
	return Math.floor((Math.random() * (Math.pow(2, 32))));
}


/************

initialize helper vars to keep info

************/

var currentPokemonArray = [];