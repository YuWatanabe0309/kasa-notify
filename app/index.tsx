import axios from 'axios';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from 'react-native';

const API_KEY = Constants.expoConfig?.extra?.apiKey;

export default function HomeScreen() {
  const [weather, setWeather] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);

  // --- 1. 位置情報の取得とパーミッション処理 ---
  useEffect(() => {
    const requestLocationAndPermission = async () => {
      // if (Platform.OS === 'android' && !Constants.isDevice) {
      //   setErrorMsg(
      //     'Androidエミュレータでは位置情報がうまく機能しない場合があります。実機で試してください。'
      //   );
      //   setIsLoading(false);
      //   return;
      // }

      // 位置情報利用の許可をリクエスト
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg(
          '位置情報の利用が許可されませんでした。設定から許可してください。'
        );
        setIsLoading(false);
        return;
      }

      // 位置情報の取得試行
      try {
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation.coords);
        setErrorMsg(null); 
      } catch (e) {
        console.warn('位置情報取得失敗:', e);
        setErrorMsg(
          '位置情報を取得できませんでした。ネットワークやGPS設定を確認してください。'
        );
        setIsLoading(false);
      }
    };

    requestLocationAndPermission();
  }, []);

  // --- 2. 天気情報の取得 (位置情報が取得できた場合に実行) ---
  useEffect(() => {
    const fetchWeatherByCoords = async (
      latitude: number,
      longitude: number
    ) => {
      const currentApiKey = Constants.expoConfig?.extra?.apiKey;
      if (!currentApiKey) {
        setErrorMsg('APIキーが設定されていません。(fetchWeather)');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${currentApiKey}&units=metric&lang=ja`
        );
        const mainWeather = response.data.weather[0].main;
        const description = response.data.weather[0].description;
        console.log(
          '天気情報 (緯度:',
        latitude,
        '経度:',
        longitude,
        '):',
        mainWeather,
        description
        );

        const needsUmbrella =
          mainWeather.includes('Rain') ||
          mainWeather.includes('Thunderstorm') ||
          mainWeather.includes('Drizzle') ||
          mainWeather.includes('Snow');

        setWeather(needsUmbrella ? '傘が必要です ☔' : '傘はいりません 🌤');
        setErrorMsg(null); 
      } catch (error) {
        console.error('天気取得APIエラー:', error);
        if (axios.isAxiosError(error)) {
          if (error.response) {
            if (error.response.status === 401) {
              setErrorMsg('APIキーが無効です。設定を確認してください。');
            } else if (error.response.status === 404) {
              setErrorMsg('指定された場所の天気情報が見つかりませんでした。');
            } else {
              setErrorMsg(`天気の取得に失敗しました (エラーコード: ${error.response.status})`);
            }
          } else if (error.request) {
            setErrorMsg('天気サーバーからの応答がありません。ネットワークを確認してください。');
          } else {
            setErrorMsg('天気情報の取得リクエスト設定に問題があります。');
          }
        } else {
          setErrorMsg('予期せぬエラーにより天気を取得できませんでした。');
        }
        setWeather(null); 
      } finally {
        setIsLoading(false);
      }
    };

    if (location) {
      fetchWeatherByCoords(location.latitude, location.longitude);
    } else if (!isLoading && !errorMsg) {
    }
  }, [location]);
  // --- 3. UIのレンダリング ---
  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color="#007AFF" />;
    }
    if (errorMsg) {
      return <Text style={styles.errorMessage}>{errorMsg}</Text>;
    }
    if (weather) {
      return <Text style={styles.message}>{weather}</Text>;
    }
    return <Text style={styles.message}>天気情報を取得中です...</Text>;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {location ? '現在地の天気' : '天気情報'}
      </Text>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    marginBottom: 25,
    color: '#2C3E50',
    fontWeight: '600',
  },
  message: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#34495E',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  errorMessage: {
    fontSize: 18,
    color: '#E74C3C',
    textAlign: 'center',
    marginTop: 15,
    paddingHorizontal: 10,
  },
});