const POCKET_CONSUMER_KEY = '87349-b4690d1647f6d4c4ac967276';
const POCKET_AUTH_URL = 'https://getpocket.com/auth/authorize';
const BASE_REDIRECT_URI = 'https://gethive.herokuapp.com/pocketRedirect';   
var url = require('url');
var request = require('request-promise');
var userModel = require('./usermodel')

exports.pocketRedirect = function(req, res){

    let referer_url = url.parse(req.headers.referer,true);
    let request_token = referer_url.query.request_token;
    let authCode = referer_url.query.authcode;
    
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
                if(objReponse && objReponse.access_token && req.query.emailId && authCode){
                    console.log(JSON.stringify(req.query))
                    return userModel.findOneAndUpdate({username:req.query.emailId, authcode:authCode},{pocketCreds:objReponse},{new:true}).exec()
                            .then(function(objUser){
                                if(objUser){
                                    return res.render('settings',{link:`/pocketAuthorize/${objUser.username}/${objUser.authCode}`})
                                }
                            })
                }
            })
}



exports.pocketAuthorize = function(req, res){
    const REDIRECT_URI = `${BASE_REDIRECT_URI}?emailId=${req.params.username}&authcode=${req.params.authcode}`
    let requestOptions = {
        method: 'POST',
        uri : "https://getpocket.com/v3/oauth/request",
        headers : {
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Accept': 'application/json'
    
        },
        body : JSON.stringify({
            "consumer_key" : POCKET_CONSUMER_KEY,
            "redirect_uri" :REDIRECT_URI
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