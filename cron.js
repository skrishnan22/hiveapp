var userModel = require("./usermodel");
var Promise = require("bluebird");
var PocketLib = require("./pocketLib"); 
var CommonLib = require("./commonLib");
var request = require('request-promise');

function mailSender(){
    return getUsers()
           .then(function(arrUsers){
              return Promise.map(arrUsers,function(objUser){
                        let offset = 0;
                        return PocketLib.getPocketContent(objUser.pocketCreds, 10, offset)
                                .then(function(pocketResponse){
                                    pocketResponse = JSON.parse(pocketResponse);
                                   let articleId =  Object.keys(pocketResponse.list)[0];
                                   console.log(pocketResponse.list[articleId].resolved_url);
                                   return request(pocketResponse.list[articleId].resolved_url)
                                            .then(function(objHTML){
                                                return CommonLib.sendContentEmail(objUser.username, objHTML)
                                            })
                                })
               },{concurrency :10})
           }) 
}

function getUsers(){
    return userModel.find({pocketCreds:{$exists:true}}).exec();
}



exports.mailSender = mailSender;