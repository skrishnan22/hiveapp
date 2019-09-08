console.log("hey there");
self.addEventListener('push', function(event) {
  let notificationOptions = {
    body : event.data.json().articleTitle,
    icon : "../images/logo.png"
  }
  self.registration.showNotification("Hive- It's Reading Time",notificationOptions);

  event.waitUntil(event);

  });