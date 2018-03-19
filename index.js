// home page of the charlottesville bahais website
const exp = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var port = 3000;

const app = exp();
// set a views folder
app.set('views','./views');
app.set('view engine','pug');
// set a static path
app.use(exp.static(path.join(__dirname, 'public')));
app.use(exp.static(path.join(__dirname, 'images')));

// needed for parsing form variables
app.use(bodyParser.urlencoded({ extended: true }));

var cassandra = require('cassandra-driver');
var client = new cassandra.Client({contactPoints:['localhost']});
/*client.execute('select key from system.local', function (err, result)  {
    if (err)  throw err;
    console.log(result.rows[0]);})*/

// ROUTES

app.get('/', function (req,res) {
    res.render('index', { title: "Hello", h1: "Charlottesville Area Bah�'�s" });
});

app.get('/about', function (req, res) {
    res.render('about', { title: "About", h1: "About" });
});

app.get('/contact', function (req, res) {
    res.render('contact', { title: "Contact", h1: "Contact" });
});

app.post('/contact', function (req, res) {
    // make sure we have the required fields and send a contact message
    if (req.body.email.length > 0 &&
        req.body.key == 2 &&
        req.body.message.length > 0 )
    {
    
        var nodemailer =require('nodemailer');
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'cvilletraininginstitute@gmail.com',
                pass: 'Perserver@nce'
            }
        });
        var mailOptions = {
            from: 'cvilletraininginstitute@gmail.com',
            to: req.body.email,
            subject: 'Contact form filled out',
            text: req.body.message
        };
        //STUB : exaping single quotes?
        //save this in a database record
        client.execute('insert into contact ( fromaddress, message, fromdatetime ) VALUES \
        ( \''+req.body.email+'\', \''+req.body.message+'\' )', function (err, result)  {
            if (err)  throw err;
            console.log(result.rows[0]);})
        // and why does this take so long to run?
        transporter.sendMail(mailOptions,function(error,info) {
            if (error) {
                console.log(error);
              } else {
                console.log('Email sent: ' + info.response);
              }
        })
    } // end user input check
})

app.get('/events', function (req, res) {
    var today = new Date();
    var twoWeeks = new Date();
    twoWeeks.setDate(today.getDate()+14); // will this work on new months?
    client.execute ('select title, location, startdatetime, duration, eventdetails \
        from cb.event where startdatetime > \''+today.toISOString()+'\' and startdatetime < \''+ twoWeeks.toISOString() +'\' \
         ALLOW FILTERING', function (err, result)  {
        if (err) { 
            console.log("Database throws an error."); 
            console.log(err); 
            res.render('error', { title: "Error Page", h1: "Sad Clown" });
        } else {
        res.render('events', { title: "Events", h1: "Events", eventdata: result });
        }
    });
    
});

app.get('/editevents', function (req, res) {
    res.render('editevents', { title: "Edit Events", h1: "Add/Edit Events" });
});

app.get('/subscribe', function (req, res) {
    res.render('subscribe', { title: "Subscribe", h1: "Subscribe" });
});
app.post('/subscribe', function (req, res) {
    // do something with the posted values here, either thank them for subscribing
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