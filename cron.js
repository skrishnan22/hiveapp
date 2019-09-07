var userModel = require("./usermodel");
var Promise = require("bluebird");
var PocketLib = require("./pocketLib"); 
var CommonLib = require("./commonLib");
var request = require('request-promise');
var moment = require("moment-timezone");
var CronJob = require("cron").CronJob;
function mailSender(){
    console.log("mail send cron started")
    return getUsers()
           .then(function(arrUsers){
              return Promise.map(arrUsers,function(objUser){
                let now = moment().tz(objUser.userTimeZone);
                if(objUser.dayList.includes(now.isoWeekday()) && objUser.mailTime === now.hour()){
                    return getArticleToSend(objUser, 0)
                                .then(function(mailData){
                                    if(mailData && mailData.articleId && mailData.articleUrl){
                                       return sendMailAndUpdateUser(objUser.username, mailData.articleId, mailData.articleUrl, mailData.articleTitle);
                                    }
                                    else{
                                        return Promise.resolve();
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    return Promise.resolve()
                                })
                }
                else{
                    return Promise.resolve();
                }
                        
                            
               },{concurrency :10})
           })
           .then(function(){
               console.log("mail send cron completed");
           }) 
           .catch(function(err){
               console.log(err);
           })
}

function getUsers(){
    return userModel.find({username:'skrish22195@gmail.com',pocketCreds:{$exists:true}}).exec();
}

function getArticleToSend(objUser, offset){
    var pocketResponse;
    return PocketLib.getPocketContent(objUser.pocketCreds, 10, offset)
            .then(function(pocketResponse){
                pocketResponse = JSON.parse(pocketResponse);
                let arrArticleIds =  Object.keys(pocketResponse.list);

                if(arrArticleIds && arrArticleIds.length){

                    if(objUser && objUser.sentPocketIds.length){
                        let unsentArticles = arrArticleIds.filter(x => !objUser.sentPocketIds.includes(x));
                        if(unsentArticles && unsentArticles.length){
                           return {
                                    articleUrl : pocketResponse.list[unsentArticles[0]].resolved_url,
                                    articleId : unsentArticles[0],
                                    articleTitle : pocketResponse.list[unsentArticles[0]].resolved_title 
                            }
                             
                        }
                        else{
                            return getArticleToSend(objUser, offset+10)
                        }
                    }
                    else{
                        return {
                                articleUrl : pocketResponse.list[arrArticleIds[0]].resolved_url,
                                articleId : arrArticleIds[0],
                                articleTitle : pocketResponse.list[unsentArticles[0]].resolved_title 
                            }
                    }
                }
                else{
                    return Promise.resolve();
                }
                
            })

}


function saveUserData(username, articleId){
    return userModel.findOneAndUpdate({username},{$set:{lastMailSentTime:new Date()}, $push:{sentPocketIds:articleId}})
}
function sendMailAndUpdateUser(username, articleId, articleUrl, articleTitle){
    return request(articleUrl)
            .then(function(htmlContent){
                return CommonLib.sendContentEmail(username, htmlContent, articleTitle)
                        .then(function(){
                            return saveUserData(username, articleId)
                        });
            });
}

var mailSender	= new CronJob({
    cronTime	:'* */15 * * * *',
    onTick		:function(){
            mailSender();
    },
    start 		:true
});
mailSender.start();

exports.mailSender = mailSender;