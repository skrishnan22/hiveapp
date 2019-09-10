console.log("hey there");
self.addEventListener('push', function(event) {
  let notificationOptions = {
    body : event.data.json().articleTitle,
    icon : "../images/logo.png",
    data : {
      url : event.data.json().articleUrl
    }
  }
  self.registration.showNotification("Hive- It's Reading Time",notificationOptions);

  event.waitUntil(event);

  });


self.addEventListener('notificationclick', function(event) {
    event.notification.close();  
    console.log(JSON.stringify(event.notification));
    clients.openWindow(event.notification.data.url)
    event.waitUntil(event);
  });