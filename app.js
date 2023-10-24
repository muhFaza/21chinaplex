require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const { User } = require("./models");
const ErrorHandler = require("./middlewares/ErrorHandler");
const cors = require("cors");
const express = require("express");
const Helper = require("./helpers");
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.post("/register", async (req, res, next) => {
  try {
    const JWTkey = Helper.generateOTP();
    const { username, email, password } = req.body;
    console.log(username, email, password, JWTkey);
    const userData = await User.create({ username, email, password, JWTkey });
    res
      .status(201)
      .json({
        id: userData.id,
        username: userData.username,
        email: userData.email,
      });
  } catch (err) {
    next(err);
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw { name: "LoginInvalidInput" };
    }
    const userData = await User.findOne({ where: { email } });
    if (!userData) {
      throw { name: "LoginUserNotFound" };
    } else {
      const comparePassword = Helper.comparePassword(
        password,
        userData.password
      );
      if (!comparePassword) {
        throw { name: "LoginInvalidPassword" };
      } else {
        const access_token = Helper.signToken(
          {
            id: userData.id,
            email: userData.email,
            username: userData.username,
          },
          userData.JWTkey
        );
        res.status(200).json({ access_token });
      }
    }
  } catch (err) {
    next(err);
  }
});

// AUTHENTICATION
// app.use(require('./middlewares/Authentication'))

app.get("/movies/trending", async (req, res, next) => {
  try {
    type = req.query.type;
    page = req.query.page;
    if (!page) page = 1;
    if (!type) type = "all";
    if (type && !["all", "movie", "tv"].includes(type)) {
      throw { name: "InvalidType" };
    }

    console.log(type, "type request");
    // movies_trending_type.json refreshes every 1 hour, whenever someone hit this endpoint
    // saves locally here for caching, 1-5 pages
    if (
      fs.existsSync(`./storage/trending/movies_trending_${type}_${page}.json`)
    ) {
      const moviesParsed = JSON.parse(
        fs.readFileSync(
          `./storage/trending/movies_trending_${type}_${page}.json`,
          "utf-8"
        )
      );
      const lastUpdate = new Date(moviesParsed.lastUpdate);
      const now = new Date();
      const diff = (now - lastUpdate) / 1000;
      if (diff < 3600) {
        console.log("data retrieved from cache");
        return res.status(200).json(moviesParsed);
      }
    }
    const movies = await axios.get(
      `https://api.themoviedb.org/3/trending/${type}/day?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=${page}`
    );
    if (page >= 1 && page <= 5) {
      movies.data.lastUpdate = new Date();
      fs.writeFileSync(
        `./storage/trending/movies_trending_${type}_${page}.json`,
        JSON.stringify(movies.data)
      );
    }
    console.log("data retrieved from API");
    return res.status(200).json(movies.data);
  } catch (err) {
    next(err);
  }
});

app.get("/movies/any", async (req, res, next) => {
  try {
    type = req.query.type;
    page = req.query.page;
    if (!page) page = 1;
    if (!type) type = "popular";
    if (type && !["popular", "top_rated", "upcoming"].includes(type)) {
      throw { name: "InvalidType" };
    }

    console.log(type, "type request");
    if (fs.existsSync(`./storage/movie/movies_${type}_${page}.json`)) {
      const moviesParsed = JSON.parse(
        fs.readFileSync(`./storage/movie/movies_${type}_${page}.json`, "utf-8")
      );
      const lastUpdate = new Date(moviesParsed.lastUpdate);
      const now = new Date();
      const diff = (now - lastUpdate) / 1000;
      if (diff < 3600) {
        console.log("data retrieved from cache");
        return res.status(200).json(moviesParsed);
      }
    }
    const movies = await axios.get(
      `https://api.themoviedb.org/3/movie/${type}?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=${page}`
    );
    if (page >= 1 && page <= 5) {
      movies.data.lastUpdate = new Date();
      fs.writeFileSync(
        `./storage/movie/movies_${type}_${page}.json`,
        JSON.stringify(movies.data)
      );
    }
    console.log("data retrieved from API");
    return res.status(200).json(movies.data);
  } catch (err) {
    next(err);
  }
});
app.get("/tvshows/any", async (req, res, next) => {
  try {
    type = req.query.type;
    page = req.query.page;
    if (!page) page = 1;
    if (!type) type = "airing_today";
    if (type && !["airing_today", "top_rated", "popular"].includes(type)) {
      throw { name: "InvalidType" };
    }

    console.log(type, "type request");
    if (fs.existsSync(`./storage/tvshows/tvshows_${type}_${page}.json`)) {
      const moviesParsed = JSON.parse(
        fs.readFileSync(
          `./storage/tvshows/tvshows_${type}_${page}.json`,
          "utf-8"
        )
      );
      const lastUpdate = new Date(moviesParsed.lastUpdate);
      const now = new Date();
      const diff = (now - lastUpdate) / 1000;
      if (diff < 3600) {
        console.log("data retrieved from cache");
        return res.status(200).json(moviesParsed);
      }
    }
    const movies = await axios.get(
      `https://api.themoviedb.org/3/tv/${type}?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=${page}`
    );
    if (page >= 1 && page <= 5) {
      movies.data.lastUpdate = new Date();
      fs.writeFileSync(
        `./storage/tvshows/tvshows_${type}_${page}.json`,
        JSON.stringify(movies.data)
      );
    }
    console.log("data retrieved from API");
    return res.status(200).json(movies.data);
  } catch (err) {
    next(err);
  }
});

app.get("/movies/now_playing", async (req, res, next) => {
  try {
    const page = 1
    // if (!page) page = 1;
    if (fs.existsSync(`./storage/nowplaying/movies_nowplaying_${page}.json`)) {
      const moviesParsed = JSON.parse(
        fs.readFileSync(
          `./storage/nowplaying/movies_nowplaying_${page}.json`,
          "utf-8"
        )
      );
      const lastUpdate = new Date(moviesParsed.lastUpdate);
      const now = new Date();
      const diff = (now - lastUpdate) / 1000;
      if (diff < 86400) {
        console.log("data retrieved from cache");
        return res.status(200).json(moviesParsed);
      }
    }
    const movies = await axios.get(
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=1`
    );
    if (page >= 1 && page <= 5) {
      movies.data.lastUpdate = new Date();
      fs.writeFileSync(
        `./storage/nowplaying/movies_nowplaying_${page}.json`,
        JSON.stringify(movies.data)
      );
    }
    console.log("data retrieved from API");
    return res.status(200).json(movies.data);
  } catch (err) {
    next(err);
  }
});

app.get("/movies/detail/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const movieDetail = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=en-US`
    );

    res.status(200).json(movieDetail.data);
  } catch (err) {
    next(err);
  }
});

app.get("/test", (req, res, next) => {
  res.status(200).json({ message: "Hello World" });
});

app.use(ErrorHandler);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
