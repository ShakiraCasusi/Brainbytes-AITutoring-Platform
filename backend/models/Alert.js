const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  alertName: String,
  status: String,
  severity: String,
  summary: String,
  description: String,
  startsAt: Date,
  endsAt: Date,
  instance: String,
  raw: Object
}, {
  timestamps: true
});

module.exports = mongoose.model("Alert", alertSchema);