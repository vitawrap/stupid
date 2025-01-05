var gaargs = [
    document.getElementById("gaarg1"),
    document.getElementById("gaarg2"),
    document.getElementById("gaarg3"),
];

var messages = [
    "You are forgiven, child.",
    "Your honesty is noble, child.",
    "What's done is done, child.",
    "Leave the past behind, child.",
    "The deed is done, child.",
    "Do not lament, child.",
    "You have a good soul, child.",
]

var confessions = Math.floor(Math.random() * 5);

function noise() {
    let number = Math.floor(Math.random() * 3);
    gaargs[number].play()
}

function confess() {
    let confession = document.getElementById("confession");
    console.log(confession.value);
    if (confession.value != "") {
        let number = Math.floor(Math.random() * 7);
        let message = messages[number];
        document.getElementById("message").innerHTML = message;
        response = document.getElementById("response");
        response.style.display = "inline";
        response.classList.add("animated");
        response.addEventListener("animationend", function() {
            response.classList.remove("animated");
            response.style.display = "none";
        });
        noise();
        confession.value = "";
    }
}
