var userObj = {
  teams: [],
  username: "",

  id: 0,
};


// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyDZ1bBHwXcR2Y8kScFzhb_j9-5OknEZD34",
  authDomain: "team-builder-app-8068a.firebaseapp.com",
  databaseURL: "https://team-builder-app-8068a.firebaseio.com",
  projectId: "team-builder-app-8068a",
  storageBucket: "team-builder-app-8068a.appspot.com",
  messagingSenderId: "438315969694",
  appId: "1:438315969694:web:18cf0dc8771d51824d5f8f",
  measurementId: "G-RJZY1XQ316"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

var database = firebase.database();

var thisUser = userObj;
var username = thisUser.username;
/* 

helper functions which interact with saving/loading from the firebase database

*/

function writeUserTeamsToDatabase(){
  // TODO: check if this user has a username first
  var username = thisUser.username;

  // first, clear user teams, unless same teams will be loaded w/ different keys
  firebase.database().ref('users/' + username + '/teams/').set(null); 

  var userTeamsDB = firebase.database().ref('users/' + username + '/teams/');

  for (var i = 0; i < thisUser.teams.length; i++){
    var team = thisUser.teams[i];
    
    var userNewTeam = userTeamsDB.push();
    var userNewTeamKey = userNewTeam.key;

    userNewTeam.set({
      game: team.game,
      playerName: team.playerName,
      playerGender: team.playerGender,
      playthroughTime: team.playthroughTime,
      dateOfFinish: team.dateOfFinish,
      tag: team.tag,
      picture: team.picture,
      randomID: team.randomID
    }, function(error) {
      if (error) {
        // The write failed...
      } else {
        // Data saved successfully!
      }
    });

    var userTeamsPokemonDB = firebase.database().ref('users/' + username + '/teams/' + userNewTeamKey + '/pokemon/');
    
    for (var j = 0; j < team.pokemon.length; j++){
      var pokemon = team.pokemon[j];

      var newTeamsPokemon = userTeamsPokemonDB.push();
      var newTeamPokemonKey = newTeamsPokemon.key;

      // types are in form string:string, as the database cannot hold arrays
      var pokemonTypes = pokemon.types;

      // stats must be converted to hp, attack, def, specA, specD, speed
      // special note: these stats have NOT been applied nature calculations to them
      var speedStat = pokemon.stats[5];
      var specialDefenseStat = pokemon.stats[4];
      var specialAttackStat = pokemon.stats[3];
      var defenseStat = pokemon.stats[2];
      var attackStat = pokemon.stats[1];
      var hpStat = pokemon.stats[0];

      // add new pokemon
      newTeamsPokemon.set({
        name: pokemon.name,
        nickname: pokemon.nickname,
        types: pokemonTypes,
        speed: speedStat,
        specialDefense: specialDefenseStat,
        specialAttack: specialAttackStat,
        defense: defenseStat,
        attack: attackStat,
        hp: hpStat,
        shiny: pokemon.shiny,
        nature: pokemon.nature,
        level: pokemon.level,
        imageLink: pokemon.imageLink
      }, function(error) {
        if (error) {
          // The write failed...
        } else {
          triggerSavedTeamsNotificationDiv();
          setCurrentlyLoggedInUser();
        }
      });
    }
  }

  // if the user didn't have any teams to save, the for loop is skipped. then, still tell the user that his teams have been saved - as they have (same as clearing).
  if (thisUser.teams.length < 1) {
    triggerSavedTeamsNotificationDiv();
  }

}

function obtainTeamsFromDatabase(inputTable, optionalUsername){
  var username = thisUser.username;

  if (optionalUsername) username = optionalUsername;

  var userTeamsDB = firebase.database().ref('users/' + username + '/teams/');

  var obtainedUserDBTeams = [];

  userTeamsDB.once('value', function(snap){
    thisUser.teams = [];

    snap.forEach(function(childNode){
      var currentTeam = intantiateTeamObj();

      currentTeam.game = childNode.val().game;
      currentTeam.playerName = childNode.val().playerName;
      currentTeam.playerGender = childNode.val().playerGender;
      currentTeam.playthroughTime = childNode.val().playthroughTime;
      currentTeam.dateOfFinish = childNode.val().dateOfFinish;
      currentTeam.tag = childNode.val().tag;
      currentTeam.picture = childNode.val().picture;
      currentTeam.randomID = childNode.val().randomID;

      // obtain team pokemon from DB by iterating through all pokemon keys
      var teamPokemonContents = [];

      childNode.child("pokemon").forEach(function(pkmnChildNode){
        var currentPokemon = intantiatePokemonObj();

        currentPokemon.name = pkmnChildNode.val().name;
        currentPokemon.nickname = pkmnChildNode.val().nickname;

        currentPokemon.types = pkmnChildNode.val().types;

        // obtain each stat from DB, then add it in correct order to the pokemon's stats array
        var pokemonStats = [];

        pokemonStats.push(pkmnChildNode.val().hp);
        pokemonStats.push(pkmnChildNode.val().attack);
        pokemonStats.push(pkmnChildNode.val().defense);
        pokemonStats.push(pkmnChildNode.val().specialAttack);
        pokemonStats.push(pkmnChildNode.val().specialDefense);
        pokemonStats.push(pkmnChildNode.val().speed);

        currentPokemon.stats = pokemonStats;

        currentPokemon.shiny = pkmnChildNode.val().shiny;

        currentPokemon.nature = pkmnChildNode.val().nature;
        currentPokemon.level = pkmnChildNode.val().level;
        currentPokemon.imageLink = pkmnChildNode.val().imageLink;

        // gender? other? 

        teamPokemonContents.push(currentPokemon);

      });

      currentTeam.pokemon = teamPokemonContents;

      // push the team obj to the user.teams
      obtainedUserDBTeams.push(currentTeam);

    });

    // set the user teams with the obtained DB values
    thisUser.teams = obtainedUserDBTeams;

    // clear table, then re-add all teams
    var t = $('#' + inputTable).DataTable();
    t.clear().draw();

    // once db 'once' method is left, data is lost - thus we must update the table here:
    for (var i = 0; i < thisUser.teams.length; i++){
      var thisRowTeam = thisUser.teams[i];

      // load vars from team
      var gameVersion = thisRowTeam.game;
      var playerName = thisRowTeam.playerName;
      var playerSex = thisRowTeam.playerGender;
      var teamRandomGeneratedID = thisRowTeam.randomID;

      // create team stats and graphs
      var dbObtainedPokemon = getPokemonFromDB(thisRowTeam.pokemon);

      // add canvas to chart
      var teamStatsDiv = '<h4>Team Leaders: </h4><div class="leader-canvas-holder"><canvas class="" id="' + teamRandomGeneratedID + '-leaders-canvas"/></div>' +
        '<h4>Team Averages: </h4><div class="average-canvas-holder"><canvas class="" id="' + teamRandomGeneratedID + '-averages-canvas"/></div>';

      // the current row added will be the length of the rows in the table
      var rowCounter = t.rows().count(); 

      addRowToDataTable(t, // doesn't include picture
        gameVersion, 
        playerName, 
        playerSex, 
        thisRowTeam.dateOfFinish, 
        thisRowTeam.playthroughTime,
        dbObtainedPokemon, // changed to innerHTML of appended pkmn from DB
        teamStatsDiv, // changed to teamstats added from DB
        thisRowTeam.tag,
        teamRandomGeneratedID,
        rowCounter);

      obtainTeamStats(teamRandomGeneratedID + "-leaders-canvas", teamRandomGeneratedID + "-averages-canvas", true, thisRowTeam.pokemon);

      // clear current pokemon array (if needed)
      currentPokemonArray = [];
    }

    // at this point, the table has been loaded with user's DB values, but the user object will not be retained on 'once' close, thus
    

  }).then(function() {
    // after finish, thisUser will be updated - but not until after .then is called
    triggerLoadedAccountNotificationDiv();
    if (!optionalUsername) setCurrentlyLoggedInUser();
    //console.log(thisUser);
  });

}

// function similar to getPokemon from main.js, but here no calls are made to pokeAPI, instead all values are 
// obtained from the DB and returned as an HTML string to paste into each table row
function getPokemonFromDB(pokemonArray){
  var finalHTMLString = '';

  for (var k = 0; k < pokemonArray.length; k++){
    // sample: <img class="pokemon-image" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/5.png" name="charmeleon" 
    // alt="58,64,58,80,65,80,,charmeleon,fire,false,,,">
    // note: for each div, id="pokemonHolderDivX" X counter - left out
    var hpStat = pokemonArray[k].stats[0];
    var attackStat = pokemonArray[k].stats[1];
    var defenseStat = pokemonArray[k].stats[2];
    var specialAttackStat = pokemonArray[k].stats[3];
    var specialDefenseStat = pokemonArray[k].stats[4];
    var speedStat = pokemonArray[k].stats[5];

    // create types string from 
    var typesString = pokemonArray[k].types;

    var imageAlt = hpStat + "," + attackStat + "," + defenseStat + "," + 
      specialAttackStat + "," + specialDefenseStat + "," + speedStat + 
      "," + pokemonArray[k].nature + 
      "," + pokemonArray[k].name + // pokemon name
      "," + typesString + // pokemon types
      "," + pokemonArray[k].shiny + // shiny
      "," + pokemonArray[k].level + // pokemon level
      "," + pokemonArray[k].nickname + // pokemon nickname
      "," + ""; // can change later to be pokemon gender/etc.

    var imageDiv = '<img class="pokemon-image" src="' + pokemonArray[k].imageLink + '" name="' + pokemonArray[k].name + '"alt="' + imageAlt + '">';  

    // obtain types div through method, add to final div holding image (with data), types
    var typesDiv = renderPokemonTypes(typesString);
    var allPokemonImagesString = '<div class="pokemon-image-holder-div" style="display: inline-block;">' + imageDiv + typesDiv + '</div>';

    finalHTMLString = finalHTMLString + allPokemonImagesString;
  }

  return finalHTMLString;
}

// function which uses an input username, checks it against all other usernames in the database, then if available, creates it, and saves current teams to it
function createNewUsername(requestedUsername){
  var database = firebase.database();
  var usernameSucceed = true;

  if (!requestedUsername){
    alert("Invalid username. Please use a new one.");
    return;
  }

  database.ref().once('value', function(snap){
    snap.child("users").forEach(function(user){

      if (user.key === requestedUsername){
        usernameSucceed = false;
      }

      // notAvailableUsernames.push(user.key);
    });
  }).then(function() {
    // once finished, if the username is not in use, create the username, and add team records to data
    if (usernameSucceed){
      thisUser.username = requestedUsername;
      setNewUserInDB(requestedUsername);

      alert("Account created! Username now exists in the database. Any current teams built have been saved under this username. On future visits, make sure to log in, and 'Load teams' using this username!");
    } else {
      alert("This username is NOT available! Please select a different one.");
    }
    
    //return notAvailableUsernames;
  });
}

function setNewUserInDB(newUsername){
  var userTeamsDB = firebase.database().ref('users/');
   //+ newUsername + '/teams/'

  var time = Date.now();

  userTeamsDB.update({
    [newUsername]: {
        accountInfo: {
          creationDate: time
        }
      }
  }, function(error) {
    if (error) {
      // The write failed...
    } else {
      writeUserTeamsToDatabase();
      // if no teams have been created and the user is new, won't traverse through DB for loop, thus set logged in user here
      setCurrentlyLoggedInUser();
    }
  }); // first, clear user teams, unless same teams will be loaded w/ different keys
}

// take an input string username, and load it from the DB
function loadUsername(inUsername){
  // put method which checks if username exists, if it does, show it does, (on completion), if it doesn't, show alert(error doesnt exist)
  var database = firebase.database();
  var usernameExist = false;

  if (document.getElementById("current-teams-user-name").innerHTML == inUsername){
    alert("Your team is currently loaded in the 'Global Teams' tab. Please clear your loaded table in 'Global Teams' first before logging into this account.")
    return;
  }

  database.ref().once('value', function(snap){
    snap.child("users").forEach(function(user){

      if (user.key === inUsername || inUsername === "" || inUsername == null){
        usernameExist = true;
      }

      // notAvailableUsernames.push(user.key);
    });
  }).then(function() {
    // once finished, if the username is not in use, create the username, and add team records to data
    if (usernameExist){
      thisUser.username = inUsername;
      obtainTeamsFromDatabase('main-table');
    } else {
      alert("This username does not exist! Either make an account, or try again.");
    }
    //return notAvailableUsernames;
  });
}

function saveUnderUsername(){
  var inUsername = thisUser.username;
  
  if (!inUsername){
    triggerNotLoggedInNotificationDiv();
    return;
  }

  var database = firebase.database();
  var usernameExist = false;

  database.ref().once('value', function(snap){
    snap.child("users").forEach(function(user){

      if (user.key === inUsername || inUsername === "" || inUsername == null){
        usernameExist = true;
      }

      // notAvailableUsernames.push(user.key);
    });
  }).then(function() {
    // once finished, if the username is not in use, create the username, and add team records to data
    if (usernameExist){
      writeUserTeamsToDatabase();

    } else {
      alert("You are not logged in! Either create an account or load your account to save teams.");
    }
    //return notAvailableUsernames;
  });
}

function logOut(){
  thisUser.username = "";
  triggerLogOutNotificationDiv();
  setCurrentlyLoggedInUser();
}

function currentLoggedInUsername(){
  return thisUser.username;
}

function clearUser(){
  firebase.database().ref('users/' + username).set({
    
  }, function(error) {
    if (error) {
      // The write failed...
    } else {
      console.log("cleared it!");
      // Data saved successfully!
    }
  });
}

/* HTML functions that add --

in text the logged in user as the 'current' logged in user*/
function setCurrentlyLoggedInUser(){
  var currentUser = currentLoggedInUsername();
  if (!currentUser){
    currentUser = "Nobody";
  }
  document.getElementById("current-logged-in-user").innerHTML = currentUser;
  createMyAccountTab();
}

function createMyAccountTab(){
  var addTo = $("#my-account-add-to-div");

  if (thisUser.username){
    // if it exists, create a div which shows the user's username, and... 
    addTo.replaceWith("<div id='my-account-add-to-div'><p>Your account, " + thisUser.username + " is all set! You can move over to 'My Teams' and " + 
      "add teams! Make sure to right click 'Help' on the top right of the screen if you have any questions.</p></div>");
  } else {
    // create a div which allows the user to make a new username
    addTo.replaceWith(
      '<div id="my-account-add-to-div">' + 
        '<p>You\'re not logged in yet. Either \'Load teams\' up top with your username, or create a username here!</p>' +
        '<div class="col-md-6 mb-3">' + 
          '<label>Create a new username: </label>' +
          '<div class="input-group">' +
            '<div class="input-group-prepend">' +
              '<span class="input-group-text"><i class="fas fa-signature"></i></span></div>' +
          '<input type="text" class="form-control" id="create-new-username-input" placeholder="Your username here..." value=""></div>' + 
        '</div>' + 
        '<div id="create-username-button-div"></div>' +

      '</div>');

    var createUsernameButton = $('<button class="btn btn-outline-secondary" id="create-username-button">Create Username</button>').click(function () {
        var attemptedUsername = document.getElementById("create-new-username-input").value;
        createNewUsername(attemptedUsername);
    });

    $("#create-username-button-div").append(createUsernameButton);
    //
  }
}

// function which checks if the user is logged in, then sends an 'are you sure' message - as teams will not be saved
function alertUserAddingTeamWithoutLogIn(){
  if (!thisUser.username){
    alert("You trying to add a team without being logged in. " +
      "If you add a team WITHOUT logging in, your previous added team's stats will NOT be saved. " +
      "To log in, load teams above. To create an account, visit the 'My Account' tab on the left.");
  }
}

/* global teams tab functions */
// function ran on click of the 'global teams' tab
function populateDropdownWithUsers(){
  var database = firebase.database();

  var dropdownID = "all-users-list-dropdown";

  var $dropdown = $('#' + dropdownID);
  $dropdown.empty();
  $dropdown.append('<option></option>');

  database.ref().once('value', function(snap){
    snap.child("users").forEach(function(user){
      // add each user to the dropdown with value of the user - if the button is clicked, it will load all teams of the selected user
      // note that the user himself should not be added - this is because if the user's teams are loaded, there will be duplicate IDs and charts will not show
      if (user.key !== thisUser.username){
        $dropdown.append($('<option></option>').attr('value', user.key).text(user.key));
      }
    });

  }).then(function() {
    $dropdown.selectize(); // then selectize the dropdown to add css/fill-in titles
  });
}

function loadGlobalUserIntoTab(inUser){
  if (inUser == thisUser.username){
    alert("Cannot load current user in Global Teams.");
    return;
  }

  obtainTeamsFromDatabase('global-teams-table', inUser);
  // set user's name on the bottom of the graph - used to check if the user then tries to log in to the same account
  document.getElementById("current-teams-user-name").innerHTML = inUser;
}

/* notification functions */
// edit notification class on the bottom right to show message pertaining to user action
function triggerSavedTeamsNotificationDiv(){
  createNotificationCSS(".notification", "green-notification", "#notifyType", "saved-teams-success");
}

function triggerNotLoggedInNotificationDiv(){
  createNotificationCSS(".notification", "yellow-notification", "#notifyType", "log-in-fail");
}

function triggerLoadedAccountNotificationDiv(){
  createNotificationCSS(".notification", "green-notification", "#notifyType", "load-teams-success");
}

function triggerLogOutNotificationDiv(){
  createNotificationCSS(".notification", "green-notification", "#notifyType", "log-out-success");
}

function createNotificationCSS(notificationClass, newNotificationClass, spanID, newSpanClass){
  $(notificationClass).toggleClass(newNotificationClass);
  $(spanID).toggleClass(newSpanClass);
  
  setTimeout(function(){
    $(notificationClass).removeClass(newNotificationClass);
    $(spanID).removeClass(newSpanClass);
  } , 1500);
}