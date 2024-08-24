const Logger = require('../Logger')
const Database = require('../Database')
const { version } = require('../../package.json')

class NotificationController {
  constructor() {}

  get(req, res) {
    res.json({
      data: this.notificationManager.getData(),
      settings: Database.notificationSettings
    })
  }

  async update(req, res) {
    const updated = Database.notificationSettings.update(req.body)
    if (updated) {
      await Database.updateSetting(Database.notificationSettings)
    }
    res.sendStatus(200)
  }

  getData(req, res) {
    res.json(this.notificationManager.getData())
  }

  async fireTestEvent(req, res) {
    await this.notificationManager.triggerNotification('onTest', { version: `v${version}` }, req.query.fail === '1')
    res.sendStatus(200)
  }

  async createNotification(req, res) {
    const success = Database.notificationSettings.createNotification(req.body)

    if (success) {
      await Database.updateSetting(Database.notificationSettings)
    }
    res.json(Database.notificationSettings)
  }

  async deleteNotification(req, res) {
    if (Database.notificationSettings.removeNotification(req.notification.id)) {
      await Database.updateSetting(Database.notificationSettings)
    }
    res.json(Database.notificationSettings)
  }

  async updateNotification(req, res) {
    const success = Database.notificationSettings.updateNotification(req.body)
    if (success) {
      await Database.updateSetting(Database.notificationSettings)
    }
    res.json(Database.notificationSettings)
  }

  async sendNotificationTest(req, res) {
    if (!Database.notificationSettings.isUseable) return res.status(500).send('Apprise is not configured')

    const success = await this.notificationManager.sendTestNotification(req.notification)
    if (success) res.sendStatus(200)
    else res.sendStatus(500)
  }
  async getNotifications(req, res) {
    const dbUser = await Database.userModel.getUserById(req.user.id)
    res.json(dbUser.notifications)
    if (req.query.isRead) {
      dbUser.notifications = dbUser.notifications.map((notification) => ({
        ...notification,
        read: true
      }))
      await Database.userModel.updateFromOld(dbUser)
    }
  }
  async clearNotifications(req, res) {
    try {
      console.log('User ID:', req.user.id)
      console.log('Notification ID:', req.query.notificationId)
      const dbUser = await Database.userModel.getUserById(req.user.id)
      if (!dbUser) {
        console.error('User not found')
        return res.status(404).send('User not found')
      }
      const notification = dbUser.notifications.find((notification) => notification.notificationId === req.query.notificationId)

      if (!notification) {
        console.error('Notification not found')
        return res.status(404).send('Notification not found')
      }

      // if find
      if (notification) {
        notification.handled = true
      }
      //save database
      await Database.userModel.updateFromOld(dbUser)
      res.sendStatus(200)
    } catch (error) {
      console.error('Error clearing notifications:', error)
      res.sendStatus(500)
    }
  }

  middleware(req, res, next) {
    if (!req.user.isAdminOrUp) {
      return res.sendStatus(404)
    }

    if (req.params.id) {
      const notification = Database.notificationSettings.getNotification(req.params.id)
      if (!notification) {
        return res.sendStatus(404)
      }
      req.notification = notification
    }

    next()
  }
}
module.exports = new NotificationController()
