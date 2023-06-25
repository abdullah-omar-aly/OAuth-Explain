const express = require("express");
const path = require("node:path");
const dotenv = require("dotenv");
dotenv.config();

const SERVER_ROOT_URI = "http://localhost:8080";

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Define the static directory to serve static files (like HTML, CSS, and JavaScript)
app.use(express.static(path.join(__dirname, "public")));

// Define a route to handle the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/signin/url", (req, res) => {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: `${SERVER_ROOT_URI}/api/auth/google/callback`,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),   
  };
  const params = new URLSearchParams(options);
  const oauthUrl = `${rootUrl}?${params.toString()}`;

  res.json({ url: oauthUrl });
});



app.get("/api/auth/google/callback", async (req, res) => {
  try {
    //we'll start by getting the code that Google has provided when it redirected user back go this route
    const { code } = req.query;
    console.log("google code", code);

    /*
     * Uses the code to get tokens
     * that can be used to fetch the user's profile
     */
    const url = "https://oauth2.googleapis.com/token";
    const values = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${SERVER_ROOT_URI}/api/auth/google/callback`,
      grant_type: "authorization_code",
    };
    const params = new URLSearchParams(values);
    const fetchUrl = `${url}?${params.toString()}`;

    const response = await fetch(fetchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const data = await response.json();
    const { id_token, access_token } = data;


    // Fetch the user's profile with the tokens
    const googleUser = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    ).then((res) => res.json());
    console.log(googleUser);
    

    // save the user in your database
  } catch (error) {
    console.log(error);
  }
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${port}`);
});