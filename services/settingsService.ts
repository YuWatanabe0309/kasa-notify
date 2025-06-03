import * as SecureStore from 'expo-secure-store';

const TIME_RANGE_KEY = 'user_time_range';
const THRESHOLD_KEY = 'user_threshold';
const NOTIFICATION_TIME_KEY = 'user_notification_time';

// 設定の保存
export async function saveTimeRange(startTime: string, endTime: string) {
  await SecureStore.setItemAsync(TIME_RANGE_KEY, JSON.stringify({ startTime, endTime }));
}
export async function saveThreshold(threshold: number) {
  await SecureStore.setItemAsync(THRESHOLD_KEY, String(threshold));
}
export async function saveNotificationTime(hour: number, minute: number) {
  await SecureStore.setItemAsync(NOTIFICATION_TIME_KEY, JSON.stringify({ hour, minute }));
}

// 設定の読み込み
export async function getTimeRange(): Promise<{ startTime: string; endTime: string } | null> {
  const value = await SecureStore.getItemAsync(TIME_RANGE_KEY);
  return value ? JSON.parse(value) : { startTime: '08:00', endTime: '20:00' };
}
export async function getThreshold(): Promise<number> {
  const value = await SecureStore.getItemAsync(THRESHOLD_KEY);
  return value ? parseFloat(value) : 50;
}
export async function getNotificationTime(): Promise<{ hour: number; minute: number }> {
  const value = await SecureStore.getItemAsync(NOTIFICATION_TIME_KEY);
  return value ? JSON.parse(value) : { hour: 7, minute: 0 };
}