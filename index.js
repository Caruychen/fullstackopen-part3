require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')
const app = express()

morgan.token('data', (request, response) => {
  return JSON.stringify(request.body)
})

app.use(cors())
app.use(express.static('build'))
app.use(express.json())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :data'))

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => response.json(persons))
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.get('/info', (request, response) => {
  const date = new Date()
  Person.find({}).then(persons => {
    response.send(`<p>Phonebook has info for ${persons.length} people</p><p>${date}</p>`)
  })
})

app.post('/api/persons', (request, response) => {
  const body = request.body
  if (!body.name) {
    return response.status(400).json({
      error: 'name missing'
    })
  }
  // else if (persons.map(person => person.name).includes(body.name)) {
  //   return response.status(400).json({
  //     error: 'name must be unique'
  //   })
  // }
  if (!body.number) {
    return response.status(400).json({
      error: 'number missing'
    })
  }

  const person = new Person({
    name: body.name,
    number: body.number
  })
  console.log(person)
  person.save().then(result => response.json(person))
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body
  const person = {
    name: body.name,
    number: body.number
  }
  
  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(person => {
      if (person) {
        response.status(204).end()
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.log(error.message)
  if (error.name === 'CastError') {
    response.status(400).send({ error: 'malformatted id' })
  }
  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server runnning on port ${PORT}`)
})