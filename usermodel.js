var mongoose = require("mongoose");
var  Schema = mongoose.Schema;

var UserModel = new Schema({
    username : String,
    authCode : String,
    registrationDate : {
        type: Date,
        default : Date.now
    },
    pocketCreds : {},
    userTimeZone : {},
    dayList : [],
    mailTime : Number,
    lastMailSentTime : Date,
    sentPocketIds : [],
    pushSubscription : [] 
})

module.exports = mongoose.model("userdetails", UserModel);