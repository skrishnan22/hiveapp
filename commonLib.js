var sendGrid = require('@sendgrid/mail');
var crypto = require('crypto');
const SEND_GRID_API = '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';
var userModel = require('./usermodel');
sendGrid.setApiKey(SEND_GRID_API);

exports.registerUser = function(req){
    if(req && req.body && req.body.emailId){
        return sendConfirmationEmail(req.body.emailId)
    }
}

exports.verifyUserDetails = function(req){
    if(req && req.query && req.query.emailId && req.query.authcode){
        return userModel.findOne({username: req.query.emailId}).exec()
                .then(function(objUser){
                    if(objUser && objUser.authCode === req.query.authcode)
                        return true;
                })
    }
    else{
        return Promise.resolve(false)
    }
}

function sendConfirmationEmail(emailId){
    const uniqueId = crypto.randomBytes(20).toString('hex');
    const htmlContent = "<a href='https://gethive.herokuapp.com/settings?emailId=" + emailId + "&authcode=" + uniqueId + "'>Click here to confirm email </a>";
    const email = {
        to : emailId,
        from : 'gethive@gmail.com',
        subject : 'Hive - Email Confirmation',
        text : "Click on the link to confirm your email",
        //html : "<strong>and easy to do anywhere, even with Node.js</strong>"
         html : htmlContent

    };
    return saveUserData(emailId, uniqueId)
            .then(function(){
                return sendGrid.send(email);
            })
            .catch(function(err){
                console.log(err);
                return Promise.reject(err);
            })
}

function saveUserData(emailId, uniqueId){
    let objUser = {
        username : emailId,
        authCode : uniqueId
    }

    return userModel.findOneAndUpdate({username:emailId},objUser, {upsert:true}).exec()
}