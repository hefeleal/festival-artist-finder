const artistMap = new Map(); // Map of found artists

// get festival artists
function getFestivalArtists() {
    const selectedButton = document.querySelector('.button-group-button.selected');
    let input_list;
    switch (selectedButton.textContent) {
        case "2019": input_list = artists_2019;
        break;
        case "2022": input_list = artists_2022;
        break;
        case "2023": input_list = artists_2023;
        break;
        case "2024": input_list = artists_2024;
        break;
        case "2025": input_list = artists_2025;
        break;
        default: return [];
    }
    const artists = new Set(input_list
        .replaceAll("&amp;", "&")
        .replaceAll("&#x27;", "'")
        .replaceAll("&quot;", "'")
        .replaceAll("  ", " ")
        .split("\n")
        .map(x => x.trim().normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .toLowerCase()
        )
    );
    artists.delete("");
    return artists;
}

// get user info
async function getUser() {
    let response;
    try {
        response = await fetch('https://api.spotify.com/v1/me', { headers });
    } catch (error) {
        showDialog(error);
        return null;
    }
    if (response.status != 200) {
        const loggedIn = await getRefreshToken();
        if (loggedIn) {
            return await getUser();
        } else {
            return null;
        }
    }
    const data = await response.json();
    return data.id;
}

// check artists (playlists, saved tracks, followed artists, top artists, recently played tracks)
async function check() {
    document.querySelector('#spinner').style.display = 'inline-block';
    document.querySelector('#checkButton').disabled = true;
    document.querySelector('#artist-list').innerHTML = "";
    const festivalArtists = getFestivalArtists();

    artistMap.clear();
    let skip = false; // skip all subsequent API calls if any fetch() call throws an error
    const checkbox1 = document.querySelector('input[name="playlist-toggle"]');
    if (checkbox1.checked) { // compare artists from all user's playlists with festival artists
        const playlists = await getMyPlaylists();
        if (playlists == null) {
            skip = true;
        } else {
            for (const p of playlists) {
                await getArtistsOfPlaylist(p.id, festivalArtists, p.name);
            }
        }
    }
    const checkbox2 = document.querySelector('input[name="saved-tracks-toggle"]');
    if (checkbox2.checked) { // compare the user's saved tracks with festival artists
        skip = skip || false == await getMySavedArtists(festivalArtists);
    }
    const checkbox3 = document.querySelector('input[name="artists-follow-toggle"]');
    if (checkbox3.checked) { // compare the user's followed artists with festival artists
        skip = skip || false == await getMyFollowedArtists(festivalArtists);
    }
    const checkbox4 = document.querySelector('input[name="top-artist-toggle"]');
    if (checkbox4.checked) { // compare the user's top artists with festival artists
        skip = skip || false == await getMyTopArtists(festivalArtists);
    }
    const checkbox5 = document.querySelector('input[name="recently-played-toggle"]');
    if (checkbox5.checked) { // compare the user's recently played tracks with festival artists
        skip = skip || false == await getMyRecentlyPlayedTracks(festivalArtists);
    }
    document.querySelector('#spinner').style.display = 'none';
    document.querySelector('#checkButton').disabled = false;
    if (artistMap.size == 0) {
        document.querySelector('#artist-list').innerHTML = "<span style='font-size: 14px;'><i data-i18n-key='no-artists-found'></i> 😕</span>";
        updateEmptyTranslations();
    }
}

// get playlists that the currently logged in user created
async function getMyPlaylists() {
    const id = await getUser();
    if (id == null) {
        return null;
    }
    let url = 'https://api.spotify.com/v1/me/playlists?limit=50';
    const playlists = [];

    do {
        let response;
        try {
            response = await fetch(url, { headers });
        } catch (error) {
            showDialog(error);
            return null;
        }
        if (response.status != 200) {
            const loggedIn = await getRefreshToken();
            if (loggedIn) {
                continue;
            } else {
                return null;
            }
        }
        const data = await response.json();
        for (const item of data.items) {
            if (item.owner.id === id) {
                const p = {
                    id: item.id,
                    name: item.name
                }
                playlists.push(p);
            }
        }
        url = data.next;
    } while (url !== null);
    return playlists;
}

// get all artists from a given playlist
async function getArtistsOfPlaylist(playlistId, festivalArtists, playlistName) {
    return getArtistsFromAPI('https://api.spotify.com/v1/playlists/' + playlistId + '/tracks?limit=50', festivalArtists, "<span data-i18n-key='playlist-info'></span> " + escapeHtml(playlistName));
}

// get all artists from the user's saved artists
async function getMySavedArtists(festivalArtists) {
    return getArtistsFromAPI('https://api.spotify.com/v1/me/tracks?limit=50', festivalArtists, "<span data-i18n-key='saved-tracks-info'></span>");
}

// generic function to get artists from a tracks API endpoint
async function getArtistsFromAPI(url, festivalArtists, source) {
    do {
        let response;
        try {
            response = await fetch(url, { headers });
        } catch (error) {
            showDialog(error);
            return false;
        }
        if (response.status != 200) {
            const loggedIn = await getRefreshToken();
            if (loggedIn) {
                continue;
            } else {
                return false;
            }
        }
        const data = await response.json();
        for (const item of data.items) {
            for (const artist of item.track.artists) {
                const artistName = artist.name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
                if (festivalArtists.has(artistName)) {
                    if (!artistMap.has(artist.id)) {
                        const newArtist = {
                            url: artist.external_urls.spotify,
                            formattedName: artist.name,
                            occurrences: new Set([source])
                        };
                        artistMap.set(artist.id, newArtist);
                        addArtistToOutput(newArtist);
                    } else {
                        artistMap.get(artist.id).occurrences.add(source);
                        updateEntireOutput();
                    }
                }
            }
        }
        url = data.next;
    } while (url !== null);
}

// get all artists which the user follows
async function getMyFollowedArtists(festivalArtists) {
    const source = "<span data-i18n-key='artists-follow-info'></span>";
    let url = 'https://api.spotify.com/v1/me/following?type=artist&limit=50';
    do {
        let response;
        try {
            response = await fetch(url, { headers });
        } catch (error) {
            showDialog(error);
            return false;
        }
        if (response.status != 200) {
            const loggedIn = await getRefreshToken();
            if (loggedIn) {
                continue;
            } else {
                return false;
            }
        }
        const data = await response.json();
        for (const item of data.artists.items) {
            const artistName = item.name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
            if (festivalArtists.has(artistName)) {
                if (!artistMap.has(item.id)) {
                    const newArtist = {
                        url: item.external_urls.spotify,
                        formattedName: item.name,
                        occurrences: new Set([source])
                    };
                    artistMap.set(item.id, newArtist);
                    addArtistToOutput(newArtist);
                } else {
                    artistMap.get(item.id).occurrences.add(source);
                    updateEntireOutput();
                }
            }
        }
        url = data.artists.next;
    } while (url !== null);
}

// get user's top artists
async function getMyTopArtists(festivalArtists) {
    const source = "<span data-i18n-key='top-artist-info'></span>";
    let url = 'https://api.spotify.com/v1/me/top/artists?limit=50';
    do {
        let response;
        try {
            response = await fetch(url, { headers });
        } catch (error) {
            showDialog(error);
            return false;
        }
        if (response.status != 200) {
            const loggedIn = await getRefreshToken();
            if (loggedIn) {
                continue;
            } else {
                return false;
            }
        }
        const data = await response.json();
        for (const item of data.items) {
            const artistName = item.name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
            if (festivalArtists.has(artistName)) {
                if (!artistMap.has(item.id)) {
                    const newArtist = {
                        url: item.external_urls.spotify,
                        formattedName: item.name,
                        occurrences: new Set([source])
                    };
                    artistMap.set(item.id, newArtist);
                    addArtistToOutput(newArtist);
                } else {
                    artistMap.get(item.id).occurrences.add(source);
                    updateEntireOutput();
                }
            }
        }
        url = data.next;
    } while (url !== null);
}

// get user's recently played tracks
async function getMyRecentlyPlayedTracks(festivalArtists) {
    return getArtistsFromAPI('https://api.spotify.com/v1/me/player/recently-played?limit=50', festivalArtists, "<span data-i18n-key='recently-played-info'></span>");
}

function updateEntireOutput() {
    const textOutput = document.querySelector('#artist-list');
    textOutput.innerHTML = "";
    for (const [key, value] of artistMap) {
        textOutput.innerHTML += "<li><span class='artist-label'><a target='_blank' href='" + value.url + "'>" + value.formattedName + "</a> </span><span class='source-label'>(" + Array.from(value.occurrences).join(", ") + ")</span></li>";
    }
    updateEmptyTranslations();
}

function addArtistToOutput(newArtist) {
    const textOutput = document.querySelector('#artist-list');
    textOutput.innerHTML += "<li><span class='artist-label'><a target='_blank' href='" + newArtist.url + "'>" + newArtist.formattedName + "</a> </span><span class='source-label'>(" + Array.from(newArtist.occurrences).join(", ") + ")</span></li>";
    updateEmptyTranslations();
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
