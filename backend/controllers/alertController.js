const Alert = require("../models/Alert");

exports.receiveAlert = async (req, res) => {
  try {
    const alerts = req.body.alerts || [];

    for (const alert of alerts) {
      await Alert.create({
        alertName: alert.labels.alertname,
        status: alert.status,
        severity: alert.labels.severity,
        summary: alert.annotations.summary,
        description: alert.annotations.description,
        startsAt: alert.startsAt,
        endsAt: alert.endsAt,
        instance: alert.labels.instance,
        raw: alert
      });
    }

    res.status(200).json({
      success: true,
      received: alerts.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
};