const mongoose = require('mongoose')
const app = require('../app')

const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@adopet.4mysvl1.mongodb.net/?retryWrites=true&w=majority`)
.then(() => {
  app.listen(3333, () => console.log('Server is running in PORT 3333!'))
})
.catch((error) => console.log(error))