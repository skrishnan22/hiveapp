const VAPID_PUBLIC_KEY = 'BF8gguMdlPJJp4rs8AatFewCjeTP31vWWOloE4r1i1Rv902pO1O12klx9AmZn4DAvmIQJRU5B6DHat3pqNm60aQ';
function getselectedDays(){
    let allCheckBoxes = document.getElementsByClassName('weekday');
    let selectedDays = [];
    for(let i=0; i<allCheckBoxes.length; i++){
        if(allCheckBoxes[i].checked)
            selectedDays.push(allCheckBoxes[i].value);
    }
    return selectedDays;
}

function getUrlParameter(name) {
name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
var results = regex.exec(location.search);
return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function postData(objData){
    var xhr = new XMLHttpRequest();
    document.getElementsByClassName('save-response')[0].innerText = "";
    xhr.open('POST', '/savePreferences');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            let responseElement = document.getElementsByClassName('save-response')[0]
            responseElement.innerText = xhr.responseText;
            setTimeout(function () {
            responseElement.style.display='none';
            }, 5000);
            responseElement.classList.add('success-response');

            }
    };
    xhr.send(JSON.stringify(objData));
}

function postPushNotification(pushSubscription){
    var xhr = new XMLHttpRequest();
    let username = getUrlParameter('emailId')
    xhr.open('POST', '/savePushNotification');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            alert("subscription saved");
            }
    };

    xhr.send(JSON.stringify({username,pushSubscription}));
    alert("subscription sent");

}

document.getElementsByClassName('save-settings')[0].onclick = function(){
    let dayList = getselectedDays();
    let mailTime = Number(document.getElementsByClassName("time-picker")[0].value);
    let username = getUrlParameter('emailId');
    let userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    postData({username,dayList,mailTime, userTimeZone})

}

function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function askPermission() {
    return new Promise(function(resolve, reject) {
      const permissionResult = Notification.requestPermission(function(result) {
        resolve(result);
      });
      if (permissionResult) {
        permissionResult.then(resolve, reject);
      }
    })
    .then(function(permissionResult) {
      if (permissionResult !== 'granted') {
        throw new Error('We weren\'t granted permission.');
      }
      return permissionResult;
    });
}

function pushNotificationSubscription(){

    return navigator.serviceWorker.register('js/service-worker.js')
            .then(function(registration) {
            console.log('Service worker successfully registered.');
            return registration;
            })
            .then(function(registration){
                alert("service worker registered");
                const objSubscribe = {
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)                
                };
                return registration.pushManager.subscribe(objSubscribe);
            })
            .then(function(pushSubscription) {
                alert("push subscribe done")
               return postPushNotification(pushSubscription); 
            })
            .catch(function(err) {
                alert(err);
            console.error('Unable to register service worker.', err);
            });
  
}

if(('serviceWorker' in navigator) && ('PushManager' in window)){
    
    if(Notification.permission !== "granted"){
            askPermission()
                .then(function(permissionResult){
                            if(permissionResult === 'granted'){
                                    return pushNotificationSubscription();
                            }
                })
                .catch(function(err){
                    console.log(err);
                })

    }
        
}
