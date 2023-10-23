require('dotenv').config()
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

app.get('/test', (req, res, next) => {
  res.status(200).json({ message: 'Hello World' })
})

app.use(ErrorHandler)

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})