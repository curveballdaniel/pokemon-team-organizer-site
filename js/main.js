// pokeapi calls
var counter = 1;

// populate pokemon dropdown select on modal open
$(window).on('pageshow', function(){ 
	populatePokemonDropdown();
});

// ensure removing pokemon click begins false
var removePokemonOnClick = false;

/********************************************************************
obtain input pokemon value (from html), get from pokeAPI, then return stats + image
*********************************************************************/

  // Create the XHR object.
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
}

// Make the actual CORS request.
function makeCorsRequest(input, idAddToName) {
  // This is a sample server that supports CORS.
  var url = 'http://pokeapi.co/api/v2/pokemon/' + input + '/';

  var xhr = createCORSRequest('GET', url);
  xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
  xhr.setRequestHeader('Access-Control-Allow-Methods', 'GET');
  xhr.setRequestHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, X-Auth-Token');
  
  if (!xhr) {
    alert('CORS not supported');
    return;
  }

  // Response handlers.
  xhr.onload = function() {
    var text = xhr.responseText;
    var response = JSON.parse(text);

    var typesString = "";

    for (i = response.types.length - 1; i > -1; i--){
      typesString = typesString + response.types[i].type.name;
      if (i > 0){
        typesString = typesString + ":";
      }
    }

    var speedStat = response.stats[0].base_stat;
    var specialDefenseStat = response.stats[1].base_stat;
    var specialAttackStat = response.stats[2].base_stat;
    var defenseStat = response.stats[3].base_stat;
    var attackStat = response.stats[4].base_stat;
    var hpStat = response.stats[5].base_stat;

    // create stats chart for pokemon
    var pokemonHolderDiv = document.createElement("div");
    var pokemonHolderDivName = "pokemonHolderDiv" + counter;
    pokemonHolderDiv.setAttribute("class", "pokemon-image-holder-div");
    pokemonHolderDiv.setAttribute("id", pokemonHolderDivName);
    pokemonHolderDiv.style.display = "inline-block";
    document.getElementById(idAddToName).appendChild(pokemonHolderDiv); // add the div to the main passed in ID name

    var newPokemon = document.createElement("img");
    newPokemon.setAttribute("class", "pokemon-image");

    // check for shiny
    if (document.getElementById("shiny-checkbox").checked) {
      newPokemon.src = response.sprites.front_shiny;
    } else {
      newPokemon.src = response.sprites.front_default;
    }

    document.getElementById(pokemonHolderDivName).appendChild(newPokemon);

    var pokemonNature = document.getElementById("pokemonnature-select").value;

    // add pokemon stats + nature as data in img (alt)
    // 6 stats, then nature, then name, then types, then shiny (t/f), then lvl...
    newPokemon.setAttribute("name", input);
    newPokemon.setAttribute("alt", hpStat + "," + attackStat + "," + defenseStat + "," + 
      specialAttackStat + "," + specialDefenseStat + "," + speedStat + 
      "," + pokemonNature + 
      "," + input + // pokemon name
      "," + typesString + // pokemon types
      "," + document.getElementById("shiny-checkbox").checked + // shiny
      "," + document.getElementById("level-input").value + // pokemon level
      "," + document.getElementById("nickname-input").value + // pokemon nickname
      "," + ""); // can change later to be pokemon gender/etc.

    // up counter for next ids
    counter = counter + 1;

    // add pokemon types under image (passing in typesString instead of response in order to make function reusable for uploading from db)
    var typesDiv = renderPokemonTypes(typesString);

    $("#" + pokemonHolderDivName).append(typesDiv);

    document.getElementById("addpokemon-button").disabled = false;
  };

  xhr.onerror = function() {
    alert('Woops, there was an error making the request.');
  };

  xhr.send();

  return null;
}


function getPokemon(idAddToName){
  // obtain pokemon name from selected dropdown, then get from api
  var input = document.getElementById("pokemon-dropdown").value;

  if (input === "") {
  	return;
  }

  document.getElementById("addpokemon-button").disabled = true;

  // CLEARED FOR ERRORS: MR MIME (mr-mime) TYPE NULL (type-null), TAPUs, NIDORAN(male:female)
  // obtain response from CORS request
  makeCorsRequest(input, idAddToName);

}

// return string HTML for types input - input comes in 'x:y' format, or 'x'
function renderPokemonTypes(typesString){
	var typesArray = typesString.split(':');

	var typeImages = "";

	for (var i = 0; i < typesArray.length; i++){
		var imageShell = "<img class=\"type-image\" src=\"img\\pokemon-types\\" + typesArray[i] + ".png\" style=\"\"></img>"
		typeImages += imageShell;
	}

	// create holder div for types
	var typesHolderDiv = "<div class=\"type-holder-div\">" + typeImages + "</div>";
    
    return typesHolderDiv;
}

function parseStatsString(statsString){

  // contains: 6 stats, then nature, then name, then types, then shiny (t/f), then lvl, then nickname, in string form separated by ','
  var convertedStrings = statsString.split(','); // will now contain all info in array form

  var gender = convertedStrings[12]; // is gender now, always "", but can be changed to form, etc.
  var nickname = convertedStrings[11];
  var level = convertedStrings[10];
  var shiny = convertedStrings[9]; // true/false
  var types = convertedStrings[8]; // type (or types, separated by ':' i.e. fire:flying)
  var name = convertedStrings[7];
  var nature = convertedStrings[6];
  var speedStat = parseInt(convertedStrings[5]);
  var specialDefenseStat = parseInt(convertedStrings[4]);
  var specialAttackStat = parseInt(convertedStrings[3]);
  var defenseStat = parseInt(convertedStrings[2]);
  var attackStat = parseInt(convertedStrings[1]);
  var hpStat = parseInt(convertedStrings[0]);

  return [hpStat, attackStat, defenseStat, specialAttackStat, specialDefenseStat, speedStat, nature, name, types, shiny, level, nickname, gender];
}

function generateGraph(imageAltString, canvasToAttachID){

  var statsArray = parseStatsString(imageAltString); // contains each stat (int) in array form
  var onlyPokemonStatsArray = [statsArray[0], statsArray[1], statsArray[2], statsArray[3], statsArray[4], statsArray[5]];

  // parse statsArray for non-pokemon stats to attach to graph
  var nickname = statsArray[11];
  if (nickname.length > 0) nickname = " AKA (" + statsArray[11] + ")"; // add nickname if exists

  var level = statsArray[10]; // string of boolean 
  var levelString = "";
  if (!(level === "")) levelString = "Level " + level + " ";

  var shiny = statsArray[9]; // string of boolean 
  var shinyString = "";
  if (shiny == 'true') shinyString = "shiny ";

  var pokemonName = statsArray[7]; 
  var pokemonNature = statsArray[6];

  var natureAppliedStatArray = applyNatureToStatArray(pokemonNature, onlyPokemonStatsArray);
  
  // rest should be aquired from the nature applied stat array
  var speedStat = natureAppliedStatArray[5];
  var specialDefenseStat = natureAppliedStatArray[4];
  var specialAttackStat = natureAppliedStatArray[3];
  var defenseStat = natureAppliedStatArray[2];
  var attackStat = natureAppliedStatArray[1];
  var hpStat = natureAppliedStatArray[0];

  var ctx = document.getElementById(canvasToAttachID).getContext('2d');
  ctx.canvas.parentNode.style.width = "250px";
  ctx.canvas.parentNode.style.height = "200px";
  
  var myBarChart = new Chart(ctx, {
    type: 'horizontalBar',
    data: {
      labels: ['HP: ' + hpStat, 'Attack: ' + attackStat, 'Defense: ' + defenseStat, 'Sp. Atk: ' + specialAttackStat, 'Sp. Def: ' + specialDefenseStat, 'Speed: ' + speedStat],
      datasets: [{
          label: levelString + shinyString + pokemonNature.toLowerCase() + ' ' + pokemonName + nickname,
          data: [hpStat, attackStat, defenseStat, specialAttackStat, specialDefenseStat, speedStat],
          backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)'
          ],
          borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
      }]
    },
    options: {
	    legend: {
	    	display: true,
	    	labels: {
			   boxWidth: 0,
			}
	    },
	  	tooltips: {
	    	callbacks: {
	      	label: function(tooltipItem) {
	        	// console.log(tooltipItem)
	        	return tooltipItem.yLabel;
	        }
	      }
	    },
      	scales: {
          xAxes: [{
              ticks: {
                  beginAtZero: true
              }
          }],
          yAxes: [{
            ticks: {
              mirror: true
            }
          }]
      }
    }
  });
}

function createPokemonImageHoverCSS(newRowID) {
	// find the specific pokemon/images added, then attach a graph to each css
	$("#" + newRowID).children().find(".pokemon-image").each(function(index) {
		$(this).mouseenter(function (e) {
		  var pokemonChartWrapper = document.createElement("div");
		  pokemonChartWrapper.setAttribute("id", "pokemon-chart-wrapper");
		  pokemonChartWrapper.style.position = "absolute";
		  //newPokemonStatsChart.setAttribute("height", "96");
		  //newPokemonStatsChart.setAttribute("width", "96");
		  document.body.appendChild(pokemonChartWrapper);

		  var hoverPokemonStatsChart = document.createElement("canvas");
		  hoverPokemonStatsChart.setAttribute("id", "pokemon-stats-chart");
		  //newPokemonStatsChart.setAttribute("height", "96");
		  //newPokemonStatsChart.setAttribute("width", "96");
		  document.getElementById("pokemon-chart-wrapper").appendChild(hoverPokemonStatsChart);

		  generateGraph(this.alt, "pokemon-stats-chart");

		  $('#pokemon-chart-wrapper').css('top', e.pageY + 25);
		  $('#pokemon-chart-wrapper').css('left', e.pageX + 25);

		})
		.mouseleave(function () {                                              
		  var element = document.getElementById('pokemon-chart-wrapper');
		  if (element) element.parentNode.removeChild(element);              
		})
		.mousemove(function (e) {
		  $('#pokemon-chart-wrapper').css({
		      top: e.clientY + 25, //+$('#pokemon-chart-wrapper').height(),
		      left: e.clientX + 25 //+$('#pokemon-chart-wrapper').width()/2
		  });                 
		});
		
	});
}

// teamPokemon only necessary if fromDBboolean is true - meaning that we are pulling from another source rather than from the images below the user
function obtainTeamStats(inLeadersCanvasID, inAveragesCanvasID, fromDBboolean, teamPokemon){

  var pokemonFullTeamStatsArray = [];
  var pokemonFullTeamNamesArray = [];

  if (!fromDBboolean){
  	$("#pokemon-list").children().each(function () {
		var $pokemonMainDiv = $(this).children();
		var $pokemonImageDiv = $(this).children(".pokemon-image");
		var stats = $pokemonImageDiv.attr("alt");
		var name = $pokemonImageDiv.attr("name");

		pokemonFullTeamStatsArray.push(stats);
		pokemonFullTeamNamesArray.push(name);
	});
  } 
  // otherwise - values coming in from db, thus use passed in team object, and pull pokemon stats/names from it in for loop

  var maxSpeed = 0;
  var maxSpeedPokemon = "";
  var averageSpeed = 0;

  var maxSpecialDefense = 0;
  var maxSpecialDefensePokemon = "";
  var averageSpecialDefense = 0;

  var maxSpecialAttack = 0;
  var maxSpecialAttackPokemon = "";
  var averageSpecialAttack = 0;

  var maxDefense = 0;
  var maxDefensePokemon = "";
  var averageDefense = 0;

  var maxAttack = 0;
  var maxAttackPokemon = "";
  var averageAttack = 0;

  var maxHp = 0;
  var maxHpPokemon = "";
  var averageHp = 0;

  if (!fromDBboolean){
	  for (var b = 0; b < pokemonFullTeamStatsArray.length; b++){
	    var pokemonStatsArray = parseStatsString(pokemonFullTeamStatsArray[b]);
	    //console.log(pokemonStatsArray);
	    var pokemonName = pokemonFullTeamNamesArray[b];

	    var preNatureAppliedStatsArray = [
	    	parseInt(pokemonStatsArray[0]), parseInt(pokemonStatsArray[1]), 
	    	parseInt(pokemonStatsArray[2]), parseInt(pokemonStatsArray[3]), 
	    	parseInt(pokemonStatsArray[4]), parseInt(pokemonStatsArray[5])
	    ];

	    var natureAppliedStatsArray = applyNatureToStatArray(pokemonStatsArray[6], preNatureAppliedStatsArray); // apply (nature, stats)

	    var speedStat = natureAppliedStatsArray[5];
	    var specialDefenseStat = natureAppliedStatsArray[4];
	    var specialAttackStat = natureAppliedStatsArray[3];
	    var defenseStat = natureAppliedStatsArray[2];
	    var attackStat = natureAppliedStatsArray[1];
	    var hpStat = natureAppliedStatsArray[0];

	    // set current stats to maxes if needed
	    if (maxSpeed < speedStat){
	      maxSpeed = speedStat;
	      maxSpeedPokemon = pokemonName;
	    }

	    if (maxSpecialDefense < specialDefenseStat){
	      maxSpecialDefense = specialDefenseStat;
	      maxSpecialDefensePokemon = pokemonName;
	    }

	    if (maxSpecialAttack < specialAttackStat){
	      maxSpecialAttack = specialAttackStat;
	      maxSpecialAttackPokemon = pokemonName;    
	    }

	    if (maxDefense < defenseStat){
	      maxDefense = defenseStat;
	      maxDefensePokemon = pokemonName; 
	    }

	    if (maxAttack < attackStat){
	      maxAttack = attackStat;
	      maxAttackPokemon = pokemonName;
	    }

	    if (maxHp < hpStat){
	      maxHp = hpStat;
	      maxHpPokemon = pokemonName;
	    }

	    // add all stats to team averages 
	    averageHp = averageHp + hpStat;
	    averageAttack = averageAttack + attackStat;
	    averageDefense = averageDefense + defenseStat;
	    averageSpecialAttack = averageSpecialAttack + specialAttackStat;
	    averageSpecialDefense = averageSpecialDefense + specialDefenseStat;
	    averageSpeed = averageSpeed + speedStat;

	  }
  } else { // if we are pulling in straight from DB
  	for (var a = 0; a < teamPokemon.length; a++){
		//pokemonFullTeamStatsArray.push(teamPokemon[a].stats);
		pokemonFullTeamNamesArray.push(teamPokemon[a].name);

	    var natureAppliedStatsArray = applyNatureToStatArray(teamPokemon[a].nature, teamPokemon[a].stats); // apply (nature, stats)

	    var speedStat = natureAppliedStatsArray[5];
	    var specialDefenseStat = natureAppliedStatsArray[4];
	    var specialAttackStat = natureAppliedStatsArray[3];
	    var defenseStat = natureAppliedStatsArray[2];
	    var attackStat = natureAppliedStatsArray[1];
	    var hpStat = natureAppliedStatsArray[0];

	    //console.log(natureAppliedStatsArray);

	    // set current stats to maxes if needed
	    if (maxSpeed < speedStat){
	      maxSpeed = speedStat;
	      maxSpeedPokemon = teamPokemon[a].name;
	    }

	    if (maxSpecialDefense < specialDefenseStat){
	      maxSpecialDefense = specialDefenseStat;
	      maxSpecialDefensePokemon = teamPokemon[a].name;
	    }

	    if (maxSpecialAttack < specialAttackStat){
	      maxSpecialAttack = specialAttackStat;
	      maxSpecialAttackPokemon = teamPokemon[a].name;    
	    }

	    if (maxDefense < defenseStat){
	      maxDefense = defenseStat;
	      maxDefensePokemon = teamPokemon[a].name; 
	    }

	    if (maxAttack < attackStat){
	      maxAttack = attackStat;
	      maxAttackPokemon = teamPokemon[a].name;
	    }

	    if (maxHp < hpStat){
	      maxHp = hpStat;
	      maxHpPokemon = teamPokemon[a].name;
	    }

	    // add all stats to team averages 
	    averageHp = averageHp + hpStat;
	    averageAttack = averageAttack + attackStat;
	    averageDefense = averageDefense + defenseStat;
	    averageSpecialAttack = averageSpecialAttack + specialAttackStat;
	    averageSpecialDefense = averageSpecialDefense + specialDefenseStat;
	    averageSpeed = averageSpeed + speedStat;

	}
  }

  // now create averages, either using 'alt' pokemons stats array or passed in stats from DB
  if (pokemonFullTeamStatsArray.length > 0){
    averageHp = (averageHp / pokemonFullTeamStatsArray.length).toFixed(1);
    averageAttack = (averageAttack / pokemonFullTeamStatsArray.length).toFixed(1);
    averageDefense = (averageDefense / pokemonFullTeamStatsArray.length).toFixed(1);
    averageSpecialAttack = (averageSpecialAttack / pokemonFullTeamStatsArray.length).toFixed(1);
    averageSpecialDefense = (averageSpecialDefense / pokemonFullTeamStatsArray.length).toFixed(1);
    averageSpeed = (averageSpeed / pokemonFullTeamStatsArray.length).toFixed(1);
  } else {
  	averageHp = (averageHp / teamPokemon.length).toFixed(1);
    averageAttack = (averageAttack / teamPokemon.length).toFixed(1);
    averageDefense = (averageDefense / teamPokemon.length).toFixed(1);
    averageSpecialAttack = (averageSpecialAttack / teamPokemon.length).toFixed(1);
    averageSpecialDefense = (averageSpecialDefense / teamPokemon.length).toFixed(1);
    averageSpeed = (averageSpeed / teamPokemon.length).toFixed(1);
  }

  // previously used, prechart text to display info on team stats + averages 
  var teamStatsWrapperDiv = "";

  var teamLeadersHTML = "<h5>Team Leaders: </h5>" +
    "<p>HP: " + maxHpPokemon + ", at " + maxHp + "</p>" +
    "<p>Attack: " + maxAttackPokemon + ", at " + maxAttack + "</p>" +
    "<p>Defense: " + maxDefensePokemon + ", at " + maxDefense + "</p>" +
    "<p>Sp. Atk: " + maxSpecialAttackPokemon + ", at " + maxSpecialAttack + "</p>" +
    "<p>Sp. Def: " + maxSpecialDefensePokemon + ", at " + maxSpecialDefense + "</p>" +
    "<p>Speed: " + maxSpeedPokemon + ", at " + maxSpeed + "</p>";

  var teamAveragesHTML = "<h5>Team Averages: </h5>" +
    "<p>HP: " + averageHp + "</p>" +
    "<p>Attack: " + averageAttack + "</p>" +
    "<p>Defense: " + averageDefense + "</p>" +
    "<p>Sp. Atk: " + averageSpecialAttack + "</p>" +
    "<p>Sp. Def: " + averageSpecialDefense + "</p>" +
    "<p>Speed: " + averageSpeed + "</p>";

  // create leaders graph, then add to leader canvas ID
  var leadersctx = document.getElementById(inLeadersCanvasID).getContext('2d');
  leadersctx.canvas.parentNode.style.width = "300px";
  leadersctx.canvas.parentNode.style.height = "150px";

  var myLeadersBarChart = new Chart(leadersctx, {
    type: 'horizontalBar',
    data: {
      labels: ['HP: ' + maxHpPokemon + ", at " + maxHp, 
      	'Attack: ' + maxAttackPokemon + ", at " + maxAttack, 
      	'Defense: ' + maxDefensePokemon + ", at " + maxDefense, 
      	'Sp. Atk: ' + maxSpecialAttackPokemon + ", at " + maxSpecialAttack, 
      	'Sp. Def: ' + maxSpecialDefensePokemon + ", at " + maxSpecialDefense, 
      	'Speed: ' + maxSpeedPokemon + ", at " + maxSpeed],
      datasets: [{
          label: 'Stat Leaders',
          data: [maxHp, maxAttack, maxDefense, maxSpecialAttack, maxSpecialDefense, maxSpeed],
          backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)'
          ],
          borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
      }]
    },
    options: {
	  legend: {
    	display: false
  	  },
      scales: {
          xAxes: [{
              ticks: {
                  beginAtZero: true
              }
          }],
          yAxes: [{
            ticks: {
              mirror: true
            }
          }]
      }
    }
  });

  // create averages canvas graph, then add to average canvas ID
  var averagesctx = document.getElementById(inAveragesCanvasID).getContext('2d');
  averagesctx.canvas.parentNode.style.width = "300px";
  averagesctx.canvas.parentNode.style.height = "150px";

  var myAveragesBarChart = new Chart(averagesctx, {
    type: 'horizontalBar',
    data: {
      labels: ['HP: ' + averageHp, 
      	'Attack: ' + averageAttack, 
      	'Defense: ' + averageDefense, 
      	'Sp. Atk: ' + averageSpecialAttack, 
      	'Sp. Def: ' + averageSpecialDefense, 
      	'Speed: ' + averageSpeed],
      datasets: [{
          label: 'Team Averages',
          data: [averageHp, averageAttack, averageDefense, averageSpecialAttack, averageSpecialDefense, averageSpeed],
          backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)'
          ],
          borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
      }]
    },
    options: {
	  legend: {
        display: false
      },
      scales: {
          xAxes: [{
              ticks: {
                  beginAtZero: true
              }
          }],
          yAxes: [{
            ticks: {
              mirror: true
            }
          }]
      }
    }
  });

  return "<div class='team-stats-text'>" + teamLeadersHTML + teamAveragesHTML + "</div>";
}

/********************************************************************
trainer images 
*********************************************************************/

function getTrainerImage(version, sex) {
    var trainerImageString = "";

    var imageLocation = "";

    var height = 225;
    var width = 100;

    if (version === "Red" || version === "Blue" || version === "Yellow") {
      var imageLocation = "img/pokemon-trainers/red.png";
      height = 180;
      width = 90;
    } else if (version === "Crystal" && sex === "Female"){
      var imageLocation = "img/pokemon-trainers/kris.png";
    } else if (version === "Gold" || version === "Silver" || version === "Crystal") {
      height = 180;
      width = 90;
      var imageLocation = "img/pokemon-trainers/gold.png";
    } else if ((version === "Ruby" || version === "Sapphire" || version === "Emerald") && sex === "Male") {
      height = 180;
      width = 90;
      var imageLocation = "img/pokemon-trainers/brendan.png";
    } else if ((version === "Ruby" || version === "Sapphire" || version === "Emerald") && sex === "Female") {
      height = 180;
      width = 90;
      var imageLocation = "img/pokemon-trainers/may.png";
    } else if ((version === "Fire Red" || version === "Leaf Green") && sex === "Male") {
      height = 180;
      width = 90;
      var imageLocation = "img/pokemon-trainers/red-firered.png";
    } else if ((version === "Fire Red" || version === "Leaf Green") && sex === "Female") {
      height = 180;
      width = 90;
      var imageLocation = "img/pokemon-trainers/leaf.png";
    } else if ((version === "Diamond" || version === "Pearl" || version === "Platinum") && sex === "Male") {
      var imageLocation = "img/pokemon-trainers/lucas.png";
    } else if ((version === "Diamond" || version === "Pearl" || version === "Platinum") && sex === "Female") {
      height = 200;
      var imageLocation = "img/pokemon-trainers/dawn.png";
    } else if ((version === "Heart Gold" || version === "Soul Silver") && sex === "Male") {
      var imageLocation = "img/pokemon-trainers/ethan.png";
    } else if ((version === "Heart Gold" || version === "Soul Silver") && sex === "Female") {
      var imageLocation = "img/pokemon-trainers/lyra.png";
    } else if ((version === "Black" || version === "White") && sex === "Male") {
      height = 250;
      var imageLocation = "img/pokemon-trainers/hilbert.png";
    } else if ((version === "Black" || version === "White") && sex === "Female") {
      var imageLocation = "img/pokemon-trainers/hilda.png";
    } else if ((version === "Black 2" || version === "White 2") && sex === "Male") {
      var imageLocation = "img/pokemon-trainers/nate.png";
    } else if ((version === "Black 2" || version === "White 2") && sex === "Female") {
      height = 250;
      var imageLocation = "img/pokemon-trainers/rosa.png";
    } else if ((version === "X" || version === "Y") && sex === "Male") {
      height = 250;
      var imageLocation = "img/pokemon-trainers/calem.png";
    } else if ((version === "X" || version === "Y") && sex === "Female") {
      height = 300;
      width = 125;
      var imageLocation = "img/pokemon-trainers/serena.png";
    } else if ((version === "Omega Ruby" || version === "Alpha Sapphire") && sex === "Male") {
      height = 250;
      var imageLocation = "img/pokemon-trainers/omega-brendan.png";
    } else if ((version === "Omega Ruby" || version === "Alpha Sapphire") && sex === "Female") {
      height = 250;
      var imageLocation = "img/pokemon-trainers/omega-may.png"; 
    } else if ((version === "Sun" || version === "Moon") && sex === "Male") {
      var imageLocation = "img/pokemon-trainers/elio.png";
    } else if ((version === "Sun" || version === "Moon") && sex === "Female") {
      var imageLocation = "img/pokemon-trainers/selene.png";
    } else if ((version === "Ultra Sun" || version === "Ultra Moon") && sex === "Male") {
      var imageLocation = "img/pokemon-trainers/elio.png";
    } else if ((version === "Ultra Sun" || version === "Ultra Moon") && sex === "Female") {
      var imageLocation = "img/pokemon-trainers/selene.png";
    } else {
      console.log("error - can't find picture")
      return null;
    }

    trainerImageString = '<img src="' + imageLocation + '" height="' + height + '" width="' + width + '">'

    return trainerImageString;   
  }

// note: passed in statArray[INTS] comes in following format: hp, attack, def, specA, specD, speed (note [0], hp isn't touched by nature)
function applyNatureToStatArray(pokemonNature, statArray){
  var inPokemonStatArray = statArray;

  // change nature from -none- to allocate correct stats ( * 1.1 for good ones, * 0.9 for bad ones)
  if (pokemonNature === "" || pokemonNature === "none"){
  	pokemonNature = "No nature";
  } 

  // adding natures
  // + attack natures
  if (pokemonNature === "Lonely" || pokemonNature === "Brave" || pokemonNature === "Adamant" || pokemonNature === "Naughty") {
  	inPokemonStatArray[1] = parseInt((inPokemonStatArray[1] * 1.1).toFixed(1));
  }

  // + defense natures
  if (pokemonNature === "Bold" || pokemonNature === "Relaxed" || pokemonNature === "Impish" || pokemonNature === "Lax") {
  	inPokemonStatArray[2] = parseInt((inPokemonStatArray[2] * 1.1).toFixed(1));
  }

  // + special attack natures 
  if (pokemonNature === "Modest" || pokemonNature === "Mild" || pokemonNature === "Quiet" || pokemonNature === "Rash") {
  	inPokemonStatArray[3] = parseInt((inPokemonStatArray[3] * 1.1).toFixed(1));
  }

  // + special defense natures 
  if (pokemonNature === "Calm" || pokemonNature === "Gentle" || pokemonNature === "Sassy" || pokemonNature === "Careful") {
  	inPokemonStatArray[4] = parseInt((inPokemonStatArray[4] * 1.1).toFixed(1));
  }

  // + speed natures
  if (pokemonNature === "Timid" || pokemonNature === "Hasty" || pokemonNature === "Jolly" || pokemonNature === "Naive") {
  	inPokemonStatArray[5] = parseInt((inPokemonStatArray[5] * 1.1).toFixed(1));
  }

  // Hardy, Docile, Serious, Bashful, Quirky are non-boosting stats

  // subtracting natures
  // - attack natures
  if (pokemonNature === "Bold" || pokemonNature === "Modest" || pokemonNature === "Calm" || pokemonNature === "Timid") {
  	inPokemonStatArray[1] = parseInt((inPokemonStatArray[1] * 0.9).toFixed(1));
  }

  // - defense natures
  if (pokemonNature === "Lonely" || pokemonNature === "Mild" || pokemonNature === "Gentle" || pokemonNature === "Hasty") {
  	inPokemonStatArray[2] = parseInt((inPokemonStatArray[2] * 0.9).toFixed(1));
  }

  // - special attack natures 
  if (pokemonNature === "Adamant" || pokemonNature === "Impish" || pokemonNature === "Careful" || pokemonNature === "Jolly") {
  	inPokemonStatArray[3] = parseInt((inPokemonStatArray[3] * 0.9).toFixed(1));
  }

  // - special defense natures 
  if (pokemonNature === "Naughty" || pokemonNature === "Lax" || pokemonNature === "Rash" || pokemonNature === "Naive") {
  	inPokemonStatArray[4] = parseInt((inPokemonStatArray[4] * 0.9).toFixed(1));
  }

  // - speed natures
  if (pokemonNature === "Brave" || pokemonNature === "Relaxed" || pokemonNature === "Quiet" || pokemonNature === "Sassy") {
  	inPokemonStatArray[5] = parseInt((inPokemonStatArray[5] * 0.9).toFixed(1));
  }

  return inPokemonStatArray;
}

function toggleRemovePokemonOnClick(){
	// non-removing toggle
	if (removePokemonOnClick) {
		var removeButton = document.getElementById("removepokemon-button");
		removeButton.style.background = "#007bff";
		removeButton.innerHTML = "Remove Pokemon";

		removePokemonOnClick = false;
	} else { // removing toggle
		// add an attribute to all added pokemon - on click, remove
		$("#pokemon-list").children().find(".pokemon-image").each(function(index) {
			$(this).click(function() {
				if (removePokemonOnClick){
					$(this).parent().remove();	
				}
			});
		});

		var removeButton = document.getElementById("removepokemon-button");
		removeButton.style.background = "red";
		removeButton.innerHTML = "REMOVING POKEMON (Click to toggle off)";

		removePokemonOnClick = true;
	}

	

	//$("#pokemon-list").children().find(removedPokemonString)
}


/********************************************************************
pull pokemon names from json to add to select dropdown
*********************************************************************/

function populatePokemonDropdown(){
  var $dropdown = $('#pokemon-dropdown');

  $dropdown.empty();
  $dropdown.append('<option></option>');
  //dropdown.prop('selectedIndex', 0);

  //const url = 'json/all-pokemon.json';
  var url = 'https://raw.githubusercontent.com/sindresorhus/pokemon/master/data/en.json';

  // Populate dropdown with list of provinces
  $.getJSON(url, function (data) {
    $.each(data, function (key, entry) {
      var parsedValue = entry.toLowerCase();

      if (parsedValue.includes(' ') || parsedValue.includes('.') || parsedValue.includes(':')){
      	parsedValue = parsedValue.replace(' ', '-'); // remove all spaces and replace with -
        parsedValue = parsedValue.replace('.', ''); // remove all periods for pokeAPI
        parsedValue = parsedValue.replace(':', ''); // remove all colons for pokeAPI (type: null)
      }

      // special case for nidorans - they need to be changed to nidoran-(sex)
      if (parsedValue.includes('♂')) {
      	parsedValue = 'nidoran-m';
      }

      if (parsedValue.includes('♀')) {
      	parsedValue = 'nidoran-f';
      }

	  $dropdown.append($('<option></option>').attr('value', parsedValue).text(entry));
    })
  }).done(function() { // after loading, apply selectize to the element (note adding after selectize doesn't show values, adding w/ addOption takes 3 seconds)
  	$dropdown.selectize();
  });
 
}

/********************************************************************
sort table by column 2 - date
*********************************************************************/

function sortTableByDate(){
	var table = $('#main-table').DataTable();
 
	table.order([2, 'asc']).draw(); // sort by column 2 - date
}

