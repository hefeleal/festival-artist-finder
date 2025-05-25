# Festival Artist Finder

![Screenshot of the website](/screenshot.png?raw=true)

Festival Artist Finder compares the artists of a festival with the ones from your Spotify library to see which artists you know. This is especially useful for festivals with a large number of acts, like in this case Fusion festival.

The tool can draw information from your playlists, saved tracks, followed artists, top artists, and recently played tracks.

Everything happens locally in your browser and no data is sent or stored anywhere.

## Setting it up for another festival
In order to set up the project for another festival, you need to edit the `<year>.js` files in `src/js/artists/` and add the artists of your festival instead. Also, you need to add your own Spotify API `clientId` in `login.js`. Please refer to the [Spotify API documentation](https://developer.spotify.com/documentation/web-api) for more information on how to set up your Spotify developer account.

## Running locally

```shell
python3 -m http.server 9000
```
