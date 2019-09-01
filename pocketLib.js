const POCKET_CONSUMER_KEY = '87349-b4690d1647f6d4c4ac967276';
const POCKET_AUTH_URL = 'https://getpocket.com/auth/authorize';
const REDIRECT_URI = 'https://gethive.herokuapp.com/pocketRedirect/skrish22195@gmail.com';   
var url = require('url');
var request = require('request-promise');


exports.pocketRedirect = function(req, res){
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
                    console.log("hive username",  req.username);
                    res.json(objReponse);
                }
            })
}



exports.pocketAuthorize = function(req, res){

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
}