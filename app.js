const express = require('express');
const app = express();
const mongoose = require("mongoose");
const passport = require("passport");
const bodyParser = require("body-parser");

// we're calling in the mongoose schema user
const User = require("./models/user");
const Post = require('./models/post');
//we're setting up the strategy to provide security
const LocalStrategy = require("passport-local");
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new LocalStrategy(User.authenticate()));

const passportLocalMongoose = require("passport-local-mongoose"); ////simplifies the integration between Mongoose and Passport for local authentication
const twig = require('twig');

// views
app.set('view engine', 'html');
app.engine('html', twig.__express);
app.set('views', 'views');

const mongourl = "mongodb+srv://test:123@cluster01.zv9fx.mongodb.net/authentication?retryWrites=true&w=majority";

mongoose.connect(mongourl, {
    useUnifiedTopology: true
});
app.use(require("express-session")({
    secret: "Hello i am talking right now", //decode or encode session, this is used to compute the hash.
    resave: false, //What this does is tell the session store that a particular session is still active, in the browser
    saveUninitialized: false //the session cookie will not be set on the browser unless the session is modified
}));

// add the bodyParser so we can return our information to the database
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(passport.initialize());
app.use(passport.session());

// start our server
const port = 3005;

app.listen(port, function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log("Server Started At Port " + port);
    }
});


// app.get("/home", (req, res) => {
//     res.render("/dashboard", { user: req.user })
// })

app.get("/login", (req, res) => {
    res.render("login")
})

app.get("/register", (req, res) => {
    res.render("register")
})

app.post("/register", (req, res) => {
    User.register(new User({ //passport-local-mongoose function to register a new user
            username: req.body.username,
            phone: req.body.phone,
        }),
        req.body.password,
        function (err, user) {
            if (err) {
                console.log(err);
            }
            passport.authenticate("local")(req, res, function () { // authenticate the local session and redirect to login page
                console.log(req);
                res.redirect("/login");
            })
        })

});

// set up the functionality for logging in an existing user

app.post("/login", passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login"
}));

// logout functionality 

app.get("/logout",(req,res)=>{  // logout function
    req.logout();
    res.redirect("/home");
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) 
                return next();
                res.redirect('/home');
}


// stop users from seeing the dashboard if they haven't logged in
app.get("/dashboard", isLoggedIn, (req,res) =>{
    res.render('dashboard.html',{user: req.user});
    // res.render('home.html',{user: req.user});
})

////////////
app.post('/dashboard', (req, res) => {
    new Post({
            title:req.body.title,
            content:req.body.content,
            author:req.body.author,
            image:req.body.image
        })
        .save()
        .then(result => {
            console.log(result);
            res.redirect('/home');
        })
        .catch(err => {
            if (err) throw err;
        });
});

app.get('/', (req, res) => {
    // Fetch the posts from the database
    Post.find()
        .sort({
            createdAt: 'descending'
        })
        .then(result => {
            if (result) {
                res.render('home', {
                    allpost: result
                });
            }
        })
        .catch(err => {
            if (err) throw err;
        });
});

// delete function
app.get('/delete/:id', (req, res) => {
    Post.findByIdAndDelete(req.params.id)
    .then(result => {
        res.redirect('/');
        
    })
    .catch(err => {
        console.log(err);
        res.redirect('/');
    })
});

// EDIT POST
app.get('/edit/:id', (req, res) => {

    Post.findById(req.params.id)
    .then(result => {
        if(result){
            res.render('edit',{
                post:result
            });
        }
        else{
            res.redirect('/');
        }
    })
    .catch(err => {
        res.redirect('/');
    });
});

// UPDATE POST
app.post('/edit/:id', (req, res) => {
    Post.findById(req.params.id)
    .then(result => {
        if(result){
            result.title = req.body.title;
            result.content = req.body.content;
            result.author_name = req.body.author;
            return result.save();
        }
        else{
            console.log(err);
            res.redirect('/');
        }
    })
    .then(update => {
        res.redirect('/');
    })
    .catch(err => {
        res.redirect('/');
    });
});