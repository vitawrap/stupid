/** @module GUI */
/**
 * Graphical user interface module (HTML/Event hooks)
 */

/**
 * @fires GUI#orbitaccept
 * @fires GUI#orbitdeny
 */
export class GUI extends EventTarget {
    /** @type {HTMLElement | null} */
    domRoot;

    /** @type {HTMLElement} */
    orbitRoot;

    /** @type {HTMLButtonElement} */
    orbitAccept;

    /** @type {HTMLButtonElement} */
    orbitDeny;

    /** @type {HTMLElement} */
    coinsCount;

    /** @type {HTMLElement} */
    barHealth;

    /** @type {HTMLElement} */
    barEnergy;

    /**
     * TODO: Better GUI system than hardcoded gui elements.
     * @param {string} element ID of root dom element
     */
    constructor(element) {
        super();
        this.domRoot = document.getElementById(element);
        this.orbitRoot = document.getElementById("gui-enterorbit");
        this.orbitAccept = document.getElementById("gui-enterorbit-accept");
        this.orbitDeny = document.getElementById("gui-enterorbit-deny");
        
        this.orbitRoot.hidden = true;

        this.coinsCount = document.getElementById("gui-coins-count");
        this.refreshCoins();

        this.barHealth = document.getElementById("gui-bar-health").children.item(0);
        this.barEnergy = document.getElementById("gui-bar-energy").children.item(0);

        this.orbitAcceptFn =
            (() => { this.dispatchEvent(new Event("orbitaccept")); }).bind(this);
        this.orbitDenyFn =
            (() => { this.dispatchEvent(new Event("orbitdeny")); }).bind(this);
    }

    /**
     * Hook event handlers to the DOM.
     */
    connect() {
        this.orbitAccept.addEventListener("click", this.orbitAcceptFn);
        this.orbitDeny.addEventListener("click", this.orbitDenyFn);
    }

    /**
     * Unhook event handlers from the DOM.
     */
    disconnect() {
        this.orbitAccept.removeEventListener("click", this.orbitAcceptFn);
        this.orbitDeny.removeEventListener("click", this.orbitDenyFn);
    }

    /**
     * Update a stat bar in the UI
     * @param {HTMLElement} barObject HTML Bar element with a height attribute
     */
    #updateBar(barObject, ratio) {
        barObject.style.height = (ratio * 100).toString() + "%";
    }

    /**
     * Update health bar on the GUI
     * @param {number} ratio Ratio between 0 and 1.
     */
    setHealthBar(ratio) {
        this.#updateBar(this.barHealth, ratio);
    }
    
    /**
     * Update energy bar on the GUI
     * @param {number} ratio Ratio between 0 and 1.
     */
    setEnergyBar(ratio) {
        this.#updateBar(this.barEnergy, ratio);
    }

    /**
     * Show or hide orbiting prompt.
     * @param {boolean} hide Set hide state.
     */
    hideOrbitPrompt(hide) {
        this.orbitRoot.hidden = hide;
    }

    /**
     * Get coins from localstorage
     */
    get coins() {
        return Number.parseInt(localStorage.getItem('coins') || "0");
    }

    /**
     * Use "coins" getter and refresh coin count on the screen.
     */
    refreshCoins() {
        this.coinsCount.innerText = this.coins;
    }
}
