// home page of the charlottesville bahais website
const exp = require('express');

var path = require('path');
var port = 3000;

const app = exp();
// set a views folder
app.set('views','./views');
app.set('view engine','pug');
// set a static path
app.use(exp.static(path.join(__dirname, 'public')));
app.use(exp.static(path.join(__dirname, 'images')));

app.get('/', function (req,res) {
    res.render('index', {title: "Hello", h1: "Home page" });
});

app.get('/about', function (req, res) {
    res.render('about', { title: "About", h1: "About" });
});

app.get('/contact', function (req, res) {
    res.render('contact', { title: "Contact", h1: "Contact" });
});

app.get('/events', function (req, res) {
    res.render('events', { title: "Events", h1: "Events" });
});

app.get('/editevents', function (req, res) {
    res.render('editevents', { title: "Edit Events", h1: "Add/Edit Events" });
});

app.get('/subscribe', function (req, res) {
    res.render('subscribe', { title: "Subscribe", h1: "Subscribe" });
});
app.post('/subscribe', function (req, res) {
    // do somethign with the posted values here, either thank them for subscribing
    if (true) { 
        res.render('subscribed', { title: "Subscribe", h1: "Subscribed" });
    // or thank them for unsubscribing
    } else {
        res.render('unsubscribed', { title: "Un-Subscribe", h1: "Un-Subscribe" });
    }
});


app.listen(port, function () {
    console.log("Server successfully launched on port "+port);
} );