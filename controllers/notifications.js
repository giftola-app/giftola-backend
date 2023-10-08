const { StatusCodes } = require("http-status-codes");
const { UnauthenticatedError, BadRequestError } = require("../errors");

const notificationsCollection = "notifications";

const createNotification = async (req, res, respond = true) => {
  const { title, message, type } = req.body;
  _validateCreateNotificationFields(req.body);

  const notification = {
    ...req.body,
    readAt: null,
    userId: req.user.uid,
    createdAt: req.admin.firestore.Timestamp.now(),
    deletedAt: null,
  };

  const notificationRef = await req.db
    .collection(notificationsCollection)
    .add(notification);

  if (respond) {
    res.status(StatusCodes.CREATED).json({
      code: "create_notification",
      message: "Notification created successfully",
      data: { id: notificationRef.id, ...notification },
    });
  }

  return notificationRef.id;
};

const getNotifications = async (req, res) => {
  const notificationsRef = await req.db
    .collection(notificationsCollection)
    .where("userId", "==", req.user.uid)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .get();

  const notifications = [];
  notificationsRef.forEach((notification) => {
    notifications.push({ id: notification.id, ...notification.data() });
  });

  res.status(StatusCodes.OK).json({
    code: "get_notifications",
    message: "Notifications retrieved successfully",
    data: notifications,
  });
};

const readAllNotifications = async (req, res) => {
  const notificationsRef = await req.db
    .collection(notificationsCollection)
    .where("userId", "==", req.user.uid)
    .where("readAt", "==", null)
    .where("deletedAt", "==", null)
    .get();

  const batch = req.db.batch();
  notificationsRef.forEach((notification) => {
    batch.update(notification.ref, {
      readAt: req.admin.firestore.Timestamp.now(),
    });
  });

  await batch.commit();

  res.status(StatusCodes.OK).json({
    code: "read_notifications",
    message: "Notifications read successfully",
  });
};

const _validateCreateNotificationFields = (notification) => {
  switch (true) {
    case !notification.title:
      throw new BadRequestError("Title is required");
    case !notification.message:
      throw new BadRequestError("Message is required");
    case !notification.type:
      throw new BadRequestError("Type is required");
  }
};

module.exports = { createNotification, getNotifications, readAllNotifications };
