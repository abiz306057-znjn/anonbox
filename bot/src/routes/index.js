/**
 * routes/index.js
 * ایندکس همه routeها
 * نسخه ۳.۰
 */

const user = require('./user');
const message = require('./message');
const payment = require('./payment');
const referral = require('./referral');
const admin = require('./admin');

module.exports = {
  user,
  message,
  payment,
  referral,
  admin,
};