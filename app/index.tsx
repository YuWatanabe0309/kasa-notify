import axios from 'axios';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const API_KEY = '9acf2fa38e6812ffd9bb762ca88ab5fd';
export default function HomeScreen() {
  const [weather, setWeather] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=Tokyo&appid=${API_KEY}&units=metric&lang=ja`
        );
        const main = res.data.weather[0].main;
        const rain = main.includes('Rain') || main.includes('Thunderstorm');
        setWeather(rain ? '傘が必要です ☔' : '傘はいりません 🌤');
      } catch (error) {
        console.error('天気取得エラー:', error);
        setWeather('天気を取得できませんでした');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌤 今日の天気</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#333" />
      ) : (
        <Text style={styles.message}>{weather}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef6fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 16,
  },
  message: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
});
