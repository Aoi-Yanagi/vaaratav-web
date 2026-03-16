// This just fetches your own app every 4 minutes to keep the connection warm
setInterval(() => {
  console.log("Pinging database to keep it awake...");
  fetch("http://localhost:3000"); 
}, 4 * 60 * 1000);