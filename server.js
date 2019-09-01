var express = require('express');
var request = require('request-promise');
var bodyParser = require('body-parser');
var app = express();
var mongoose = require('mongoose');
var url = require('url');
var path = require('path');
const POCKET_CONSUMER_KEY = '87349-b4690d1647f6d4c4ac967276';
const POCKET_AUTH_URL = 'https://getpocket.com/auth/authorize';
const REDIRECT_URI = 'https://gethive.herokuapp.com/pocketRedirect';    
var commonLib = require('./commonLib');

const db_url ="mongodb+srv://hiveadmin:UaLsFX6y8RwLPhac@hiveprod-2a2jy.mongodb.net/test?retryWrites=true&w=majority"
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

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname,'./index.html'));
})

app.get('/settings', function(req,res){

    return commonLib.verifyUserDetails(req)
        .then(function(result){
            if(result){
                res.sendFile(path.join(__dirname, './settings.html'));
            }
            else{
                res.send("404-sorry not here bruh :)");
            }
        })
})
app.get('/pocketAuthorize',function(req, res){

    let requestOptions = {
        method: 'POST',
        uri : "https://getpocket.com/v3/oauth/request",
        headers : {
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Accept': 'application/json'
    
        },
        body : JSON.stringify({
            "consumer_key" : POCKET_CONSUMER_KEY,
            "redirect_uri" : REDIRECT_URI
        })
    }

    return request(requestOptions)
    .then(function(response){
        
        response =JSON.parse(response)
        if(response && response.code){
            let redirect_to  = `${POCKET_AUTH_URL}?request_token=${response.code}&redirect_uri=${REDIRECT_URI}`
            res.redirect(redirect_to); 
        }
    })
    .catch(function(err){
        console.log(err);
    })
})

app.get('/pocketRedirect', function(req, res){
    let referer_url = url.parse(req.headers.referer,true);
    let request_token = referer_url.query.request_token;

    let requestOptions = {
        method: 'POST',
        uri : "https://getpocket.com/v3/oauth/authorize",
        headers : {
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Accept': 'application/json'
    
        },
        body : JSON.stringify({
            "consumer_key" : POCKET_CONSUMER_KEY,
            "code" : request_token
        })
    }
    return request(requestOptions)
            .then(function(objReponse){
                objReponse = JSON.parse(objReponse);
                if(objReponse && objReponse.access_token){
                    console.log(objReponse.access_token)
                    res.json(objReponse);
                }
            })
})
app.get('/verifyemail', function(req, res){
    res.sendFile(path.join(__dirname,'./emailverification.html'));
})
app.post('/register', function(req,res){
        console.log(req.body);
    commonLib.registerUser(req);
    res.redirect('/verifyemail')
});

app.listen(process.env.PORT || 8080, function(){
    console.log("listening in port")
})