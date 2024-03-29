var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var mongoose = require('mongoose');
var path = require('path');

var commonLib = require('./commonLib');

var pocketLib = require('./pocketLib');
var Cron = require('./cron');
var ejs = require('ejs');

const db_url = process.env.DB_URL;
mongoose.connect(db_url,{useNewUrlParser:true});

var db = mongoose.connection;

db.on("error", function(){
    console.log("error connecting to db");
})

db.once("open", function(){
    console.log("connected to db");
})
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname,'./landing_assets')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname,'./index.html'));
})

app.get('/settings', function(req,res){

    return commonLib.verifyUserDetails(req)
        .then(function(result){
            if(result){
                res.render('settings',{data:result});
            }
            else{
                res.sendFile(path.join(__dirname,'./errorPage.html'));
            }
        })
})
app.get('/pocketAuthorize/:username/:authcode', pocketLib.pocketAuthorize);

app.get('/pocketRedirect', pocketLib.pocketRedirect);

app.get('/verifyemail', function(req, res){
    res.sendFile(path.join(__dirname,'./emailverification.html'));
})

app.post('/register', function(req,res){
    commonLib.registerUser(req);
    res.redirect('/verifyemail')
});

app.post('/savePreferences', commonLib.savePreferences);

app.post('/savePushNotification', commonLib.savePushNotification);

//app.get('/cron', Cron.mailSender)
app.listen(process.env.PORT || 8080, function(){
    console.log("listening in port")
})