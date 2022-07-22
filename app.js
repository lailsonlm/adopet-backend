require('dotenv').config()

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


const app = express()

app.use(express.json())
app.use(cors())

const User = require('./models/User')

async function findUserById(req, res, next) {
  const { id } = req.params;

  const user = await User.findById(id, '-password')

  if(!user) {
    return res.status(404).json({ error: "Usuário não encontrado!" })
  }

  req.user = user;

  return next();
}

function checkToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if(!token) {
    return res.status(401).json({
      error: "Acesso negado!"
    })
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);

    next()

  } catch(error) {
    res.status(400).json({
      error: "Token inválido!"
    })
  }
}


app.get('/', (req, res) => {
  res.status(200).json({ msg: 'Hello World!' })
})


app.get('/users/:id', checkToken, findUserById, async (req, res) => {
  const { user } = req;

  return res.json(user);
})

app.put('/users/:id', checkToken, findUserById, async (req, res) => {
  const { github, phone, city, about } = req.body;
  const { user } = req;

  user.github = github;
  user.phone = phone;
  user.city = city;
  user.about = about;

  try {
    await user.save()

    res.status(201).json({
      success: "Usuário atualizado com sucesso!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        github: user.github, 
        phone: user.phone,
        city: user.city, 
        about: user.about
      }
    })

  } catch(error) {
    console.log(error)
    
    res.status(500)
    .json({
      error: "Erro interno no servidor, tente novamente mais tarde."
    })
  }

})



app.post('/signup', async(req, res) => {
  const { name, email, password, github, phone, city, about } = req.body

  if(!name) {
    return res.status(422).json({
      error: "Nome é obrigatório!"
    })
  }

  if(!email) {
    return res.status(422).json({
      error: "E-mail é obrigatório!"
    })
  }

  if(!password) {
    return res.status(422).json({
      error: "Senha é obrigatória!"
    })
  }

  const userExists = await User.findOne({ email: email })

  if(userExists) {
    return res.status(422).json({
      error: "Usuário já existe!"
    })
  }

  const salt = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(password, salt)

  const user = new User({
    name,
    email,
    password: passwordHash,
  })

  try {
    await user.save()

    const secret = process.env.JWT_SECRET

    const accessToken = jwt.sign({
      id: user._id,
    }, secret , {
      expiresIn: '24h'
    })

    res.status(201).json({
      success: "Usuário cadastrado com sucesso!",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    })

  } catch(error) {
    console.log(error)
    
    res.status(500)
    .json({
      error: "Erro interno no servidor, tente novamente mais tarde."
    })
  }

})


app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if(!email) {
    return res.status(422).json({
      error: "E-mail é obrigatório!"
    })
  }

  if(!password) {
    return res.status(422).json({
      error: "Senha é obrigatória!"
    })
  }

  const user = await User.findOne({ email: email })

  if(!user) {
    return res.status(404).json({
      error: "Usuário não encontrado!"
    })
  }

  const passwordMatch = await bcrypt.compare(password, user.password)

  if(!passwordMatch) {
    return res.status(404).json({
      error: "Senha inválida."
    })
  }

  try {
    const secret = process.env.JWT_SECRET

    const accessToken = jwt.sign({
      id: user._id,
    }, secret , {
      expiresIn: '24h'
    })

    res.status(200).json({
      success: "Usuário Autenticado!",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        github: user.github, 
        phone: user.phone,
        city: user.city, 
        about: user.about
      }
    })

  } catch(error) {
    console.log(error)
    
    res.status(500)
    .json({
      error: "Erro interno no servidor, tente novamente mais tarde."
    })
  }

})


const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@adopet.4mysvl1.mongodb.net/?retryWrites=true&w=majority`)
.then(() => {
  app.listen(3333, () => console.log('Server is running in PORT 3333!'))
})
.catch((error) => console.log(error))
