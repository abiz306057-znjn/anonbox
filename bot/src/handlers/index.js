/**
 * handlers/index.js
 * ایندکس همه هندلرها
 * نسخه ۳.۰
 */

const user = require('./user');
const message = require('./message');
const payment = require('./payment');
const admin = require('./admin');

module.exports = {
  user,
  message,
  payment,
  admin,
};