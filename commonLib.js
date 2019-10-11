var sendGrid = require('@sendgrid/mail');
var crypto = require('crypto');
const SEND_GRID_API = process.env.SEND_GRID_API;
var userModel = require('./usermodel');
let fs = require('fs'); 
sendGrid.setApiKey(SEND_GRID_API);
let confirmation_email_template = fs.readFileSync("./confirmEmail.html","utf-8");
exports.registerUser = function(req){
    if(req && req.body && req.body.emailId){
        return sendConfirmationEmail(req.body.emailId)
    }
}

exports.verifyUserDetails = function(req){
    if(req && req.query && req.query.emailId && req.query.authcode){
        return userModel.findOne({username: req.query.emailId}).exec()
                .then(function(objUser){
                    if(objUser && objUser.authCode === req.query.authcode){
                        let objDayList = {
                            "1" : false,
                            "2" : false,
                            "3" : false,
                            "4" : false,
                            "5" : false,
                            "6" : false,
                            "7" : false
                        };
                        if(objUser.dayList && objUser.dayList.length){
                            objUser.dayList.forEach(function(day){
                                objDayList[day] = true
                            })
                        }
                        let objMessage = {
                            link : `/pocketAuthorize/${objUser.username}/${objUser.authCode}`,
                            pocketConnected : objUser.pocketCreds ? true : false,
                            mailTime : objUser.mailTime ? objUser.mailTime : null,
                            dayList : objDayList

                        };
                        return objMessage;
                    }
                })
    }
    else{
        return Promise.resolve(false)
    }
}

exports.savePreferences = function(req, res){
    if(req.body && req.body.username){
        return userModel.findOneAndUpdate({username:req.body.username},{dayList:req.body.dayList,mailTime:req.body.mailTime, userTimeZone: req.body.userTimeZone}).exec()
                .then(function(){
                    return res.send("Saved successfully")
                })

    }
    else{
        return Promise.resolve("Error occured while saving!")
    }
}

exports.savePushNotification = function(req,res){
    if(req.body && req.body.username && req.body.pushSubscription){
        return userModel.findOneAndUpdate({username:req.body.username},{$push : {pushSubscription:req.body.pushSubscription}})
                    .then(function(){
                        return res.send("Save successfully")
                    })
                    .catch(function(){
                        return res.send("Error occured!")
                    })
    }

    return res.send("Could not save");
}
function sendConfirmationEmail(emailId){
    const uniqueId = crypto.randomBytes(20).toString('hex');
    const settingsLink = "'https://www.gethive.app/settings?emailId=" + emailId + "&authcode=" + uniqueId + "'";
    const htmlContent = confirmation_email_template.replace("[[hiveSettingsLink]]", settingsLink);
    const email = {
        to : emailId,
        from : 'gethive@gmail.com',
        fromname : "Hive App",
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

exports.sendContentEmail = function(username, htmlContent, title){
    const email = {
        to : username,
        from : {
            email : "gethive@gmail.com",
            name : "Hive App"
        },
        subject : "Hive - " + title,
        text : "Message from Hive",
        //html : "<strong>and easy to do anywhere, even with Node.js</strong>"
         html : htmlContent
    };
    console.log("mail sent to", username)
     return sendGrid.send(email)
}

