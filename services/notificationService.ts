import axios from 'axios';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// アプリがフォアグラウンドの時に通知を受け取った時のハンドラー
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: false,
  }),
});

// 緯度経度に基づいて通知用の天気メッセージを生成する関数
async function getWeatherNotificationMessage(latitude: number, longitude: number): Promise<string> {
  const apiKey = Constants.expoConfig?.extra?.apiKey;
  if (!apiKey) {
    console.error('APIキーが設定されていません。(通知用)');
    return 'APIキーが未設定のため、天気情報を取得できません。';
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=ja`
    );
    const mainWeather = response.data.weather[0].main;
    const needsUmbrella =
      mainWeather.includes('Rain') ||
      mainWeather.includes('Thunderstorm') ||
      mainWeather.includes('Drizzle') ||
      mainWeather.includes('Snow');

    return needsUmbrella
      ? '今日の傘予報: 傘が必要です ☔'
      : '今日の傘予報: 傘はいりません 🌤';
  } catch (error) {
    console.error('通知用天気取得エラー:', error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
        return 'APIキーが無効で天気情報を取得できませんでした。';
    }
    return '天気情報を取得できませんでした。後ほどアプリを開いて確認してください。';
  }
}

// 通知の許可をリクエストする関数 
async function registerForPushNotificationsAsync(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('通知の許可が得られませんでした。');
    return false;
  }
  return true;
}

// 毎日の通知をスケジュールする関数
async function scheduleDailyNotification() {
  // 1. 位置情報の許可を確認・リクエスト
  let { status: locationStatus } = await Location.getForegroundPermissionsAsync();
  if (locationStatus !== 'granted') {
    locationStatus = (await Location.requestForegroundPermissionsAsync()).status;
  }

  if (locationStatus !== 'granted') {
    console.log('通知のための位置情報許可が得られませんでした。デフォルトの地域で試みます。');
    await Notifications.scheduleNotificationAsync({
        content: {
          title: "🌂 傘リマインダー",
          body: '位置情報が許可されていないため、現在地の天気はお知らせできません。',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, hour: 7, minute: 0, repeats: true },
      });
    return;
  }

  // 2. 現在位置の取得
  let currentLocation;
  try {
    currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch (e) {
    console.error('通知のための位置情報取得失敗:', e);
    await Notifications.scheduleNotificationAsync({
        content: {
          title: "🌂 傘リマインダー",
          body: '位置情報を取得できませんでした。天気を確認できません。',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, hour: 7, minute: 0, repeats: true },
      });
    return;
  }

  // 3. 天気情報を取得して通知をスケジュール
  const { latitude, longitude } = currentLocation.coords;
  const notificationMessage = await getWeatherNotificationMessage(latitude, longitude);

  // 既存の通知をキャンセルしてから新しい通知をスケジュール (重複を防ぐ)
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🌂 傘リマインダー (現在地)",
      body: notificationMessage,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 7,
      minute: 0,
      repeats: true,
    },
  });
  console.log('毎日の天気通知（現在地ベース）をスケジュールしました。');
}

// 通知設定をまとめる関数
export async function setupBackgroundNotifications() {
  const notificationsAllowed = await registerForPushNotificationsAsync();
  if (notificationsAllowed) {
    await scheduleDailyNotification();
  }
}