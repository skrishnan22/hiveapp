var userModel = require("./usermodel");
var Promise = require("bluebird");
var PocketLib = require("./pocketLib"); 
var CommonLib = require("./commonLib");
var request = require('request-promise');
var moment = require("moment-timezone");
var CronJob = require("cron").CronJob;

var webPush = require("web-push");
const VAPID_KEYS = {
                    publicKey: process.env.VAPID_PUBLIC_KEY,
                    privateKey: process.env.VAPID_PRIVATE_KEY
                }
webPush.setVapidDetails("mailto:skrish22195@gmail.com", VAPID_KEYS.publicKey, VAPID_KEYS.privateKey);

function mailSender(){
    console.log("mail send cron started")
    return getUsers()
           .then(function(arrUsers){
              return Promise.map(arrUsers,function(objUser){
                let mailSentToday = false;
                let now = moment().tz(objUser.userTimeZone);
                if(objUser.lastMailSentTime){
                    let prevMailTime = moment(objUser.lastMailSentTime).tz(objUser.userTimeZone);
                    let duration = moment.duration(now.diff(prevMailTime, "hours"));
                    if(duration <= 2){
                        mailSentToday = true;
                    }

                }
                if(objUser.dayList.includes(now.isoWeekday()) && objUser.mailTime === now.hour() && !mailSentToday){
                    return getArticleToSend(objUser, 0)
                                .then(function(mailData){
                                    if(mailData && mailData.articleId && mailData.articleUrl){
                                       return sendMailAndUpdateUser(objUser.username, mailData.articleId, mailData.articleUrl, mailData.articleTitle)
                                                .then(function(){
                                                    if(objUser.pushSubscription && objUser.pushSubscription.length){
                                                        let notificationData = {
                                                                                  articleTitle : mailData.articleTitle,
                                                                                  articleUrl :   mailData.articleUrl
                                                                                }

                                                        return Promise.map(objUser.pushSubscription,function(pushSubscription){
                                                            return webPush.sendNotification(pushSubscription, JSON.stringify(notificationData))
                                                            .then(function(){
                                                                console.log('web notification sent to user', objUser.username);
                                                                return Promise.resolve()
                                                            })
                                                        })                        
              
                                                    }
                                                })
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
               return Promise.resolve();
           }) 
           .catch(function(err){
               console.log(err);
           })
}

function getUsers(){
    return userModel.find({pocketCreds:{$exists:true}}).exec();
}

function getArticleToSend(objUser, offset){
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
                                articleTitle : pocketResponse.list[arrArticleIds[0]].resolved_title 
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
            })
            .catch(function(err){
                console.log(err)
            })
            .finally(function(){
                    return saveUserData(username, articleId);
                
            })
}

var mailSenderCron	= new CronJob({
    cronTime	:'0 */15 * * * *',
    onTick		:function(){
            mailSender();
    },
    start 		:true
});
mailSenderCron.start();

exports.mailSender = mailSender;