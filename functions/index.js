const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// Run every 4 hours
exports.checkPriceAlerts = onSchedule("0 */4 * * *", async (event) => {
  try {
    console.log("Starting scheduled price check...");

    // 1. Fetch current prices from Skinport
    const response = await axios.get("https://api.skinport.com/v1/items?app_id=730&currency=EUR");
    const items = response.data;
    
    const priceMap = {};
    items.forEach(item => {
      priceMap[item.market_hash_name] = item.suggested_price || item.min_price;
    });

    // 2. Get all users and their alerts from Firestore
    const usersSnapshot = await admin.firestore().collection("users").get();
    
    const notifications = [];

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const alerts = userData.priceAlerts || [];
      const fcmToken = userData.fcmToken;

      if (!fcmToken) return; // Skip users without a device token

      alerts.forEach(alert => {
        if (!alert.isActive) return;

        const currentPrice = priceMap[alert.hashName];
        if (!currentPrice) return;

        let shouldNotify = false;
        let title = "";
        let body = "";

        if (alert.isAbove && currentPrice >= alert.targetPrice) {
          shouldNotify = true;
          title = "Preisalarm ausgelöst! 📈";
          body = `${alert.hashName} ist über ${alert.targetPrice}€ gestiegen (Aktuell: ${currentPrice}€)!`;
        } else if (!alert.isAbove && currentPrice <= alert.targetPrice) {
          shouldNotify = true;
          title = "Preisalarm ausgelöst! 📉";
          body = `${alert.hashName} ist unter ${alert.targetPrice}€ gefallen (Aktuell: ${currentPrice}€)!`;
        }

        if (shouldNotify) {
          notifications.push({
            token: fcmToken,
            notification: { title, body },
            data: {
              hashName: alert.hashName,
              currentPrice: currentPrice.toString(),
            }
          });

          // Optional: Mark alert as inactive after triggering
          // We can't easily update it in this simple loop without more logic, 
          // but typically we'd update the Firestore doc here.
        }
      });
    });

    // 3. Send all notifications
    if (notifications.length > 0) {
      console.log(`Sending ${notifications.length} notifications...`);
      const results = await admin.messaging().sendEach(notifications);
      console.log(`Successfully sent ${results.successCount} messages; ${results.failureCount} failed.`);
    } else {
      console.log("No alerts triggered in this run.");
    }

  } catch (error) {
    console.error("Error running price check:", error);
  }
});
