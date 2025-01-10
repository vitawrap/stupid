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
     * Show or hide orbiting prompt.
     * @param {boolean} hide Set hide state.
     */
    hideOrbitPrompt(hide) {
        this.orbitRoot.hidden = hide;
    }
}
