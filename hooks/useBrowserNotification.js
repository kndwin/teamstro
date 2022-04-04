import { useEffect, useState } from "react";

export const useBrowserNotification = () => {
  const [permission, setPermission] = useState(false);

  const requestPermission = async () => {
    const doesUserAllowPermission = await Notification.requestPermission();
    setPermission(doesUserAllowPermission);
  };

  const setNotification = ({ title, body }) => {
    if (permission === "granted") {
      const notification = new Notification(title, { body });
      setTimeout(() => notification.close(), 5000);
    }
  };

  useEffect(() => {
    requestPermission();
  }, []);

  return { permission, setNotification };
};
