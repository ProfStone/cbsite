// home page of the charlottesville bahais website
const exp = require('express');

var path = require('path');
var port = 3000;

const app = exp();
// set a views folder
app.set('views','./views');
app.set('view engine','pug');
// set a static path
app.use(exp.static(path.join(__dirname,'public') ));

app.get('/', function (req,res) {
    res.render('index', {title: "Hello", h1: "Home page" });
});

app.listen(port, function () {
    console.log("Server successfully launched on port "+port);
} );