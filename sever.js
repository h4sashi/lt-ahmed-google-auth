const express = require('express');
const axios = require('axios');
const app = express();

// In-memory storage for user profiles (temporary)
const userProfiles = {};

// Retrieve secrets from environment variables
const CLIENT_ID     = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI  = process.env.REDIRECT_URI;

// Health‑check / landing page so Render sees a 200 on '/'
app.get('/', (req, res) => {
  res.send('✅ Google‑Auth server is running');
});

// OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  const authCode = req.query.code;
  const state    = req.query.state;

  if (!authCode || !state) {
    return res.status(400).send('Missing authorization code or state parameter.');
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        code: authCode,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      },
    });

    const { access_token } = tokenResponse.data;

    // Fetch user profile
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // Save profile in memory keyed by state
    userProfiles[state] = userResponse.data;

    // Send a simple confirmation page
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Login Successful</title>
        <style>
          body { font-family: sans-serif; text-align: center; margin-top: 50px; }
          h1 { color: #4CAF50; }
        </style>
      </head>
      <body>
        <h1>✅ Login Successful</h1>
        <p>You may now return to the app.</p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(500).send('Authentication failed.');
  }
});

// Endpoint for Unity (or any client) to retrieve the profile data
app.get('/getProfile', (req, res) => {
  const state = req.query.state;

  if (state && userProfiles[state]) {
    const profile = userProfiles[state];
    delete userProfiles[state]; // Remove once retrieved
    res.json(profile);
  } else {
    res.status(404).send('Profile not found.');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

























// const express = require('express');
// const axios = require('axios');
// const app = express();

// // In-memory storage for user profiles (temporary)
// const userProfiles = {};

// // Retrieve secrets from environment variables
// const CLIENT_ID = process.env.CLIENT_ID;
// const CLIENT_SECRET = process.env.CLIENT_SECRET;
// const REDIRECT_URI = process.env.REDIRECT_URI;

// //Create an env file that contains CLIENT_ID, CLIENT_SECRET and REDIRECT_URI. I can't directly upload it to github

// app.get('/auth/google/callback', async (req, res) => {
//     const authCode = req.query.code;
//     const state = req.query.state;

//     if (!authCode || !state) {
//         return res.status(400).send('Missing authorization code or state parameter.');
//     }

//     try {
//         // Exchange authorization code for access token
//         const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
//             params: {
//                 code: authCode,
//                 client_id: CLIENT_ID,
//                 client_secret: CLIENT_SECRET,
//                 redirect_uri: REDIRECT_URI,
//                 grant_type: 'authorization_code',
//             },
//         });

//         const { access_token } = tokenResponse.data;

//         // Fetch user profile
//         const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
//             headers: { Authorization: `Bearer ${access_token}` },
//         });

//         const userProfile = userResponse.data;
//         userProfiles[state] = userProfile;

//         // Redirect user back to Unity using a deep link
//         const deepLink = `mygame://auth?state=${state}`;
//         res.redirect(deepLink);
//     } catch (error) {
//         console.error('Error during authentication:', error);
//         res.status(500).send('Authentication failed.');
//     }
// });


// // Endpoint for Unity to retrieve the profile data
// app.get('/getProfile', (req, res) => {
//     const state = req.query.state;

//     if (state && userProfiles[state]) {
//         const profile = userProfiles[state];
//         delete userProfiles[state]; // Remove from storage after retrieval
//         res.json(profile);
//     } else {
//         res.status(404).send('Profile not found.');
//     }
// });

// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });
