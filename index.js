// home page of the charlottesville bahais website
const exp = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var port = 3000;
const uuid = require('uuid/v1');
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
var nodemailer =require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'cvilletraininginstitute@gmail.com',
        pass: 'Perserver@nce'
    }
    });
/*client.execute('select key from system.local', function (err, result)  {
    if (err)  throw err;
    console.log(result.rows[0]);})*/

// ROUTES

app.get('/', function (req,res) {
    // get things coming up this week
    var today = new Date();
    var oneWeek = new Date();
    oneWeek.setDate(today.getDate()+7); // will this work on new months?
    client.execute ('select title, location, startdatetime, duration, eventdetails \
        from cb.event where startdatetime > \''+today.toISOString()+'\' and startdatetime < \''+ oneWeek.toISOString() +'\' \
         ALLOW FILTERING', function (err, result)  {
        if (err) { 
            console.log("Database throws an error."); 
            console.log(err); 
            res.render('error', { title: "Error Page", h1: "Sad Clown" });
        } else {
        res.render('index', { title: "Hello", h1: "Charlottesville Area Bah&aacute;'$iacute;s", eventdata: result });
        }
    });
    //res.render('index', { title: "Hello", h1: "Charlottesville Area Bah�'�s" });
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
    
        
        var mailOptions = {
            from: 'cvilletraininginstitute@gmail.com',
            to: req.body.email,
            subject: 'Contact form filled out',
            text: req.body.message
        };
        transporter.sendMail(mailOptions,function(error,info) {
            if (error) {
                console.log(error);
              } else {
                console.log('Email sent: ' + info.response);
              }
        });
        //save this in a database record
        client.execute('insert into cb.contact ( fromaddress, message, fromdatetime ) VALUES \
        ( \''+req.body.email+'\', \''+req.body.message+'\' )', function (err, result)  {
            if (err)  throw err;
            console.log(result.rows[0]);})
        // and why does this take so long to run?
        
    } // end user input check
});

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
app.get('/confirm', function (req,res) {
    res.render('incorrectConfirmation');
});
app.get('/confirm/:key', function (req,res) {
    // update the record that matches this token
    console.log("user confirming subscription");
    client.execute('select email from cb.subscriber where key =\''+ req.params.key +'\' ALLOW FILTERING ',
        function (err,result) {
            if (err) {
                console.log("unable to look up user");
                console.log(err);
                res.render('error', { title: "Error Page", h1: "Sad Clown", error: "update error" });
            } else {
                console.log(result);
                if (result.length) {
                    console.log("running update for "+result[0].email);
                    client.execute ('update cb.subscriber set confirmed=True where email = \''+ result[0].email +'\' IF EXISTS', 
                    function (err,result2) {
                        if (err) {
                            console.log("Database throws an error."); 
                            console.log(err); 
                            res.render('error', { title: "Error Page", h1: "Sad Clown", error: "update error" });
                        } else {
                            res.render('confirmed');  
                        }
                    });
                } else {
                    res.render('error', { title: "Key not found", h1: "Key not found", error: "update error" });
                }
                
            }
        }
    )
    
});
app.post('/subscribe', function (req, res) {
    // do something with the posted values here, either thank them for subscribing
    
    client.execute ('select email from cb.subscriber where email = \''+ req.body.email +'\' \
         ALLOW FILTERING', function (err, result)  {
        if (err) { 
            console.log("Database throws an error."); 
            console.log(err); 
            res.render('error', { title: "Error Page", h1: "Sad Clown", error: "select error" });
        } else {
            /* if there are records returned, this person is subscribed
             we should remove them and let them know
            otherwise we can add them as unconfirmed and send them a confirmation email */
            if (result.length > 0 ) {
                client.execute('delete from cb.subscriber where email = \''+ req.body.email +'\' ', 
                function (err, result) { 
                    if (err) {
                        console.log("Database throws an error."); 
                        console.log(err); 
                        res.render('error', { title: "Error Page", h1: "Sad Clown", error: "delete error" });
                    } else {
                        res.render('unsubscribed');
                    }
                });
            } else {

                var token = uuid();
                client.execute('insert into cb.subscriber ( email, key ) values ( \''+ req.body.email +'\', \''+token+'\' )', 
                function (err, result) { 
                    if (err) {
                        console.log("Database throws an error."); 
                        console.log(err); 
                        res.render('error', { title: "Error Page", h1: "Sad Clown", error: "insert error" });
                    } else {
                        console.log("Sending email to "+req.body.email);
                        var mailOptions = {
                            from: 'cvilletraininginstitute@gmail.com',
                            to: req.body.email,
                            subject: 'Subscription Confirmation',
                            text: 'Thank you for subscribing to Charlottesville Baha\'i Events. You must follow this link to activate your subscription: http://charlottesvillebahais.org/confirm/'+token
                        };
                        transporter.sendMail(mailOptions,function(error,info) {
                            if (error) {
                                console.log(error);
                              } else {
                                console.log('Email sent: ' + info.response);
                              }
                        });
                        res.render('subscribed');
                    }
                });
                
                
            }
        }
    });
    
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