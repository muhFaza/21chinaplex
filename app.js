require('dotenv').config()
const fs = require('fs')
const axios = require('axios')
const { User } = require('./models')
const ErrorHandler = require('./middlewares/ErrorHandler')
const cors = require('cors')
const express = require('express')
const Helper = require('./helpers')
const app = express()
const port = 3000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())

app.post('/register', async (req, res, next) => {
  try {
    const JWTkey = Helper.generateOTP()
    const { username, email, password } = req.body
    console.log(username, email, password, JWTkey);
    const userData = await User.create({ username, email, password, JWTkey })
    res.status(201).json({ id: userData.id, username: userData.username, email: userData.email })
  } catch (err) {
    next(err)
  }
})

app.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      throw { name: 'LoginInvalidInput' }
    }
    const userData = await User.findOne({ where: { email } })
    if (!userData) {
      throw { name: 'LoginUserNotFound' }
    } else {
      const comparePassword = Helper.comparePassword(password, userData.password)
      if (!comparePassword) {
        throw { name: 'LoginInvalidPassword' }
      } else {
        const access_token = Helper.signToken({
          id: userData.id,
          email: userData.email,
          username: userData.username,
        }, userData.JWTkey)
        res.status(200).json({ access_token })
      }
    }
  } catch (err) {
    next(err)
  }
})

app.use(require('./middlewares/Authentication'))

app.get('/movies/trending', async (req, res, next) => {
  try {
    // movies_trending.json refreshes every 24 hours, whenever someone hit this endpoint
    if (fs.existsSync('./storage/movies_trending.json')) {
      const moviesParsed = JSON.parse(fs.readFileSync('./storage/movies_trending.json', 'utf-8'))
      const lastUpdate = new Date(moviesParsed.lastUpdate)
      const now = new Date()
      const diff = (now - lastUpdate) / 1000
      if (diff < 86400) {
        console.log('data retrieved from cache');
        res.status(200).json(moviesParsed)
      } else {
        const movies = await axios.get(`https://api.themoviedb.org/3/trending/movie/day?language=en-US&api_key=${process.env.TMDB_API_KEY}`)
        movies.data.lastUpdate = new Date()
        fs.writeFileSync('./storage/movies_trending.json', JSON.stringify(movies.data))
        console.log('data retrieved from API');
        res.status(200).json(movies.data)
      }
    }
  } catch (err) {
    next(err)
  }
})

app.get('/movies/detail/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    // tries to search from storage first
    if (fs.existsSync('./storage/movies_trending.json')) {
      const moviesParsed = JSON.parse(fs.readFileSync('./storage/movies_trending.json', 'utf-8'))
      const movie = moviesParsed.results.find(movie => movie.id == id)
      if (movie) {
        console.log('data retrieved from cache');
        res.status(200).json(movie)
      } else {
        const movieDetail = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=en-US`)
        console.log('data retrieved from API');
        res.status(200).json(movieDetail.data)
      }
    } else {
      const movieDetail = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=en-US`)
      console.log('data retrieved from API');
      res.status(200).json(movieDetail.data)
    }
  } catch (err) {
    next(err)
  }
})

app.get('/test', (req, res, next) => {
  res.status(200).json({ message: 'Hello World' })
})

app.use(ErrorHandler)

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})