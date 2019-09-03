const POCKET_CONSUMER_KEY = '87349-b4690d1647f6d4c4ac967276';
const POCKET_AUTH_URL = 'https://getpocket.com/auth/authorize';
const BASE_REDIRECT_URI = 'https://gethive.herokuapp.com/pocketRedirect'; 
const POCKET_RETRIEVE_URL = "https://getpocket.com/v3/get";  

var url = require('url');
var request = require('request-promise');
var userModel = require('./usermodel')

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
                if(objReponse && objReponse.access_token && req.query.emailId && req.query.authcode){
                    console.log(JSON.stringify(req.query))
                    return userModel.findOneAndUpdate({username:req.query.emailId, authCode:req.query.authcode},{pocketCreds:objReponse},{new:true}).exec()
                            .then(function(objUser){
                                if(objUser){
                                    return res.redirect(`/settings?emailId=${objUser.username}&authcode=${objUser.authCode}`)
                                }
                                else{
                                    return res.render('errorpage');
                                }
                            })
                }
                return res.render('errorpage');

            })
}



exports.pocketAuthorize = function(req, res){
    const REDIRECT_URI = `${BASE_REDIRECT_URI}?emailId=${req.params.username}%26authcode=${req.params.authcode}`
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

exports.getPocketContent = function(tokens, count, offset){

    let requestOptions = {
        method: 'POST',
        uri : POCKET_RETRIEVE_URL,
        headers : {
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Accept': 'application/json'
    
        },
        body : JSON.stringify({
            "consumer_key" : POCKET_CONSUMER_KEY,
            "access_token" : tokens.access_token,
            "count" : count,
            "offset" : offset,
            "detailType" : "complete",
            "contentType" : "article",
            "sort" : "newest"
        })
    };
    
   return request(requestOptions)

}