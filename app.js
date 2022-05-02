// Import express
const express = require('express')
// include Handlebars module
const exphbs = require('express-handlebars')
const flash = require('express-flash')  // for showing login error messages
const session = require('express-session')
const passport = require('./passport.js')
require('./models')

const app = express()
// configure Handlebars
app.engine(
    'hbs',
    exphbs.engine({
        defaultlayout: 'main',
        extname: 'hbs',
        helpers: {
            isIn: (str, array) => array.includes(str),
            isEmpty: array => array.length === 0,
            equals: (str1, str2) => str1 === str2,
            lte: (v1, v2) => v1 <= v2,
            gte: (v1, v2) => v1 >= v2,
            and() {
                return Array.prototype.every.call(arguments, Boolean);
            }
        }
    })
)

// set Handlebars view engine
app.set('view engine', 'hbs')

app.use(flash())

// define where static assets live
app.use(express.static('public'))

app.use(
    session({
        // The secret used to sign session cookies (ADD ENV VAR)
        secret: process.env.SESSION_SECRET || 'keyboard cat',
        name: 'generic-name', // The cookie name (CHANGE THIS)
        saveUninitialized: false,
        resave: false,
        proxy: process.env.NODE_ENV === 'production', //  to work on Heroku
        cookie: {
            sameSite: 'strict',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 300000 // sessions expire after 5 minutes
        },
    })
)

// use PASSPORT
app.use(passport.authenticate('session'))

// Passport Authentication middleware
const isAuthenticated = (req, res, next) => {
    // If user is not authenticated via Passport, redirect to login page
    if (!req.isAuthenticated()) {
        return res.redirect('/login')
    }
    // Otherwise, proceed to next middleware function
    return next()
}

// Set up to handle POST requests
app.use(express.json()) // needed if POST data is in JSON format
app.use(express.urlencoded({ extended: true })) // only needed for URL-encoded input

app.get('/login', (req, res) => { 
    res.render('login', {flash: req.flash('error'), title: 'Login'})
})

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),  // if bad login, send user back to login page
    (req, res) => { 
        res.redirect('/patient/dashboard')   // login was successful, send user to home page
    }   
)

const aboutRouter = require('./routes/aboutRouter')

app.use('/about', aboutRouter)

const clinicianRouter = require('./routes/clinicianRouter')

app.use('/clinician', clinicianRouter)

const patientRouter = require('./routes/patientRouter')

app.use('/patient', patientRouter)

// const loginRouter = require('./routes/loginRouter')

// app.use('/login', loginRouter)

app.get('/', (req, res) => {
    res.render('index.hbs', {layout: 'patient-logged-out.hbs'})
})

app.get('*', (req, res) => {
    res.render('notfound')
})

// link to our router
// const peopleRouter = require('./routes/peopleRouter')

// middleware to log a message each time a request arrives at the server - handy for debugging
app.use((req, res, next) => {
    console.log('message arrived: ' + req.method + ' ' + req.path)
    next()
})

// the demo routes are added to the end of the '/demo-management' path
// app.use('/people', peopleRouter)

// Tells the app to listen on port 3000 and logs tha tinformation to the console.
app.listen(process.env.PORT || 3000, () => {
    console.log('The library app is running!')
})
