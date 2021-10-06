const Sequelize = require('sequelize');
const db = require('../config/database');

const Notification = db.define('Notification', {
    seen_by_user: {
        type: Sequelize.BOOLEAN
    },
    
});

module.exports = Notification;