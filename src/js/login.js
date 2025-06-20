const clientId = '1d9ad9a1dd704a23bdf61224db82e870';
let headers; // auth headers

async function login() {
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    const scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative user-library-read user-follow-read user-top-read user-read-recently-played';
    const authUrl = new URL("https://accounts.spotify.com/authorize");
    window.localStorage.setItem('code_verifier', codeVerifier);

    const params =  {
        response_type: 'code',
        client_id: clientId,
        scope,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        redirect_uri: window.location.origin + window.location.pathname,
    }

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
}

function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input) {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

async function getToken(code) {
    const codeVerifier = localStorage.getItem('code_verifier');
    const url = "https://accounts.spotify.com/api/token";
    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'authorization_code',
            code,
            redirect_uri: window.location.origin + window.location.pathname,
            code_verifier: codeVerifier,
        }),
    }

    let response;
    try {
        response = await fetch(url, payload);
    } catch (error) {
        return false;
    }
    if (response.status == 200) {
        const data = await response.json();
        saveAuthTokens(data);
        return true;
    } else {
        return false;
    }
}

async function getRefreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken == null) {
        document.querySelector('#mainContainer').style.display = 'none';
        document.querySelector('#loginContainer').style.display = 'block';
        return false;
    }
    const url = "https://accounts.spotify.com/api/token";
    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId
        }),
    }

    let response;
    let request_failed = false;
    try {
        response = await fetch(url, payload);
    } catch (error) {
        request_failed = true;
    }
    if (!request_failed && response.status == 200) {
        const data = await response.json();
        saveAuthTokens(data);
        return true;
    } else {
        localStorage.removeItem('refresh_token');
        document.querySelector('#mainContainer').style.display = 'none';
        document.querySelector('#loginContainer').style.display = 'block';
        return false;
    }
}

function saveAuthTokens(json_response) {
    document.querySelector('#mainContainer').style.display = 'block';
    document.querySelector('#loginContainer').style.display = 'none';
    headers = { 'Authorization': json_response.token_type + ' ' + json_response.access_token };
    localStorage.setItem('token_type', json_response.token_type);
    localStorage.setItem('access_token', json_response.access_token);
    localStorage.setItem('expires_in', json_response.expires_in);
    if (json_response.refresh_token) {
        localStorage.setItem('refresh_token', json_response.refresh_token);
    }
}

function showDialog(message) {
    const overlay = document.getElementById('dialog');
    overlay.classList.remove('fade-out');
    overlay.classList.add('show');
    document.getElementById('dialogText').innerHTML = message;
    document.addEventListener('keydown', handleEscape);
}

function closeDialog() {
    const overlay = document.getElementById('dialog');
    overlay.classList.remove('show');
    overlay.classList.add('fade-out');
    document.removeEventListener('keydown', handleEscape);
    overlay.addEventListener('transitionend', () => {
        overlay.classList.remove('fade-out');
    }, { once: true });
}

function handleEscape(event) {
    if (event.key === 'Escape') {
        closeDialog();
    }
}

async function loadContent() {
    document.addEventListener('gesturestart', function (e) {
        e.preventDefault();
    });
    const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    const button = document.querySelector('#checkButton');

    const updateButtonState = () => {
        const anyChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
        button.disabled = !anyChecked;
    };
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateButtonState);
    });
    updateButtonState();

    document.getElementById('dialog').addEventListener('click', function (e) {
        if (!document.getElementById('dialogBox').contains(e.target)) {
            closeDialog();
        }
    });

    const buttonGroupButtons = document.querySelectorAll('.button-group-button');
    buttonGroupButtons.forEach(button => {
        button.addEventListener('click', () => {
            buttonGroupButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        await getToken(code);
        history.pushState("", document.title, window.location.pathname);
    } else {
        await getRefreshToken();
    }
}

document.addEventListener('DOMContentLoaded', loadContent, false);
