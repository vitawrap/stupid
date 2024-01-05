/* Lines for failed attempts to leave the Tunnels of Glembo */
const fails = [ "The Tunnels of Glembo are unforgiving to you.",
		"Another twist and turn in the Tunnels of Glembo leads you nowhere.",
		"This was not the right direction. You really should've brought a map for the Tunnels of Glembo.",
		"You spot something in the distance! It's the Tunnels of Glembo!",
		"Tunnels of Glembo.",
		"You find a penny on the floor of the Tunnels of Glembo. You pocket it, as it may be a lucky item.",
		"Glembo must have been a cruel person to create these Tunnels of his.",
		"Exploring the Tunnels of Glembo fills you with determination.",
		"You trip over a rock comically! The Tunnels of Glembo will do anything to stop you from reaching the other side!",
		"In a haze, you imagine Glembo infront of you. But alas, it was but another trick of the Tunnels of Glembo",
		"Could this be the Labyrinth? Or perhaps the Tunnels of Glembo are simply one part of a greater Labyrinth?"
];
/* Lines for when a player exits the Tunnels of Glembo */
const succeed = [ "There's something at the end of this tunnel. Could this be the exit to the Tunnels of Glembo?",
	"A light is visible at the end of the corridor. You have escaped the Tunnels of Glembo.",
	"A wall collapses infront of you! It's an exit from the Tunnels of Glembo!",
	"It appears that the Tunnels of Glembo aren't as endless as they seem.",
	"Tunnels of Glembo."
];

/* Links to exits to the Tunnels of Glembo */
/* Expand to this if you want to make your page reachable through the Tunnels of Glembo */
const locations = [ "../",
	"../baba.html"
];
/* Links to images for the Tunnels of Glembo */
/* Don't include the .gif at the end. Case Sensitive, probably. */
const tunnels = [
	"corridorTorch",
	"corridorMouse"
];

var visualBox = document.getElementById("ToGvisual");
var textBox = document.getElementById("ToGevent");
var exitLink = document.getElementById("ToGexit");
var trybutton = document.getElementById("ToGtryagain");

var nrrNum = 0;
var newNum;
function rando (maxNum) {
	var attempt = 0;
	while(newNum == undefined || newNum == nrrNum && attempt < 12){
		newNum = Math.floor(Math.random() * maxNum);
		attempt++;
	}
	nrrNum = newNum;
	return newNum;
}

/* Runs the tunnels of glembo. */
function TunnelsOfGlembo() {
	var status = Math.floor(Math.random() * 100);
	if (status >= 90) {
		/* Winner */
		textBox.innerHTML = succeed[rando(succeed.length)];
		visualBox.src = "corridorExit.gif";
		exitLink.href = locations[Math.floor(Math.random() * locations.length)];
		exitLink.style.display="block";
		trybutton.style.display="none";
	} else {
		/* Fail state */
		textBox.innerHTML = fails[rando(fails.length)];
		exitLink.style.display="none";
		
		var chance = rando(100);
		if (chance <= 67) {
			visualBox.src="corridor.gif";
		} else {
			visualBox.src=tunnels[rando(tunnels.length)] + ".gif";
		}
	}
	
}
trybutton.addEventListener("click", TunnelsOfGlembo);