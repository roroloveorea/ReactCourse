const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const Person = require('./models/person')

dotenv.config()
const app = express()
app.use(express.json())
app.use(cors())
app.use(express.static('build'))

// Configure Morgan middleware
morgan.token('body', (req, res) => JSON.stringify(req.body))
app.use(morgan(function (tokens, req, res) {
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms',
        tokens.body(req, res, 'content-length'),
    ].join(' ')
}))


// Info
app.get('/info', (request, response) => {
    Person.find({}).then(persons => {
        response.send('<p>Phonebook has info for ' + persons.length + ' people</p>' + '<p>' + new Date() + '</p>')
    })
})

// Create a contact
app.post('/api/persons', (request, response) => {
    const body = request.body
    // Check if required fields are present
    if (!body.name || !body.number) {
        return response.status(400).json({
            error: 'Missing name or number'
        })
    }

    // Check if name already exists
    Person.find({ name: body.name }).then(persons => {
        if (persons.length > 0) {
            response.status(400).json({
                error: 'Name already exists'
            })
            return
        }

        else {
            // Construct new person
            const person = new Person({
                name: body.name,
                number: body.number,
            })

            person.save().then(savedPerson => {
                response.json(savedPerson)
            })
        }
    })
})

// Read
app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
})

// Read a single contact
app.get('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    Person.find({ id: id }).then(persons => {
        response.json(persons)
    })
})

// Delete 
app.delete('/api/persons/:id', (request, response) => {
    const id = mongoose.Types.ObjectId(request.params.id)
    Person.deleteOne({ _id: id }).then(result => {
        if (result.deletedCount === 0) {
            return response.status(404).json({
                error: 'Contact not found'
            })
        }

        response.status(204).end()
    })
})

app.put('/api/persons/:id', (request, response) => {
    const id = mongoose.Types.ObjectId(request.params.id)
    const body = request.body

    Person.updateOne({ _id: id }, { number: body.number }).then(res => {
        if (res.modifiedCount > 0){
            response.json(body)
        }
    })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})