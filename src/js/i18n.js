let locale = "en";

const translations = {
    "en": {
        "title": "Fusion Artist Finder",
        "welcome-text": "Welcome to Fusion Artist Finder.",
        "main-text": "After logging in with Spotify, you can check which artists from your Spotify library play or played at Fusion Festival.",
        "login-button": "Login with Spotify",
        "playlist-toggle": "Artists from my playlists",
        "saved-tracks-toggle": "Artists from my saved tracks",
        "artists-follow-toggle": "Artists I follow",
        "top-artist-toggle": "My top artists",
        "recently-played-toggle": "My 50 recently played tracks",
        "everything-button": "Check everything",
        "playlist-info": "Playlist",
        "saved-tracks-info": "Saved tracks",
        "artists-follow-info": "Followed artist",
        "top-artist-info": "Top artist",
        "recently-played-info": "Recently played",
        "check-button": "Go",
        "no-artists-found": "Nothing found",
        "dialog-error": "Error",
        "dialog-retry": "Please try again.",
        "dialog-ok": "OK",
    },
    "de": {
        "title": "Fusion Artist Finder",
        "welcome-text": "Willkommen beim Fusion Artist Finder.",
        "main-text": "Nachdem du dich mit Spotify angemeldet hast, kannst du checken, welche Künstler aus deiner Spotify Library auf dem Fusion Festival spielen bzw. gespielt haben.",
        "login-button": "Login mit Spotify",
        "playlist-toggle": "Künstler aus meinen Playlists",
        "saved-tracks-toggle": "Künstler aus meinen gespeicherten Tracks",
        "artists-follow-toggle": "Künstler, denen ich folge",
        "top-artist-toggle": "Meine top Künstler",
        "recently-played-toggle": "Meine 50 zuletzt gespielten Tracks",
        "everything-button": "Alles checken",
        "playlist-info": "Playlist",
        "saved-tracks-info": "Gespeicherte Tracks",
        "artists-follow-info": "Gefolgter Künstler",
        "top-artist-info": "Top Künstler",
        "recently-played-info": "Kürzlich abgespielt",
        "check-button": "Los",
        "no-artists-found": "Nichts gefunden",
        "dialog-error": "Fehler",
        "dialog-retry": "Bitte nochmal versuchen.",
        "dialog-ok": "OK",
    },
};

document.addEventListener("DOMContentLoaded", () => {
    const selector = document.querySelector("#language-selector");
    if (navigator.language.startsWith("de")) {
        locale = "de";
        selector.value = "de";
    }
    translatePage();
    selector.onchange = (e) => {
        locale = e.target.value;
        translatePage();
    };
});

function translatePage() {
    const elements = document.querySelectorAll("[data-i18n-key]");
    for (const element of elements) {
        element.innerText = translations[locale][element.getAttribute("data-i18n-key")];
    }
}

function updateEmptyTranslations() {
    const elements = document.querySelectorAll("[data-i18n-key]:empty");
    for (const element of elements) {
        element.innerText = translations[locale][element.getAttribute("data-i18n-key")];
    }
}
