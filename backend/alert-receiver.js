// alert-receiver.js
const express = require('express');
const app = express();
app.use(express.json());

app.post('/alert', (req, res) => {
  console.log('Alert received:');
  console.log(JSON.stringify(req.body, null, 2));
  res.status(200).end();
});

const PORT = process.env.ALERT_RECEIVER_PORT || 8082;
app.listen(PORT, () => {
  console.log(`✓ Alert receiver listening on port ${PORT}`);
});
