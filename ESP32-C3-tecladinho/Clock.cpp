#include "Clock.h"

const String endpoint = "http://worldtimeapi.org/api/timezone/Europe/Berlin";

Clock::Clock(LiquidCrystal_I2C *display)
{
  lcd = display;
}

void Clock::alarm()
{
  digitalWrite(8, HIGH);
  buzzerTone(10, 50, 2000);
  digitalWrite(8, LOW);
}

void Clock::silence()
{
  if (alarmSet)
  {
    alarmSet = false;
    lcd->clear();
    lcd->setCursor(0, 0);
    lcd->print("Alarm disabled. ");
    delay(3000);
    lcd->clear();
  }
}

void Clock::addToSnooze()
{
  snooze = snooze < 3300 ? snooze + 300 : snooze;
  int snoozeMinutes = snooze / 60;
  lcd->clear();
  lcd->setCursor(0, 0);
  lcd->print("Snooze");
  lcd->setCursor(0, 1);
  lcd->print(snoozeMinutes);
  lcd->print(" minutes.");
  delay(3000);
  lcd->clear();
}

void Clock::printTime(uint8_t hours, uint8_t minutes, uint8_t seconds)
{
  lcd->setCursor(4, 0);
  if (hours < 10)
  {
    lcd->print('0');
  }
  lcd->print(hours);
  lcd->print(':');
  if (minutes < 10)
  {
    lcd->print('0');
  }
  lcd->print(minutes);
  lcd->print(':');
  if (seconds < 10)
  {
    lcd->print('0');
  }
  lcd->print(seconds);
  lcd->print("        ");
}

void Clock::updateClock()
{
  gettimeofday(&currentTime, NULL);
  int totalMinutes = currentTime.tv_sec / 60;
  int hours = totalMinutes / 60;
  int minutes = totalMinutes % 60;
  int totalSeconds = minutes / 60;
  int seconds = currentTime.tv_sec % 60;
  printTime(hours, minutes, seconds);
  uint32_t c = currentTime.tv_sec;
  uint32_t a = alarmTime.tv_sec;
  if (alarmSet && c >= a + snooze && c < a + 3600 )
  {
    alarm();
  }
}

bool Clock::setTimeFromAPI()
{
  if ((WiFi.status() == WL_CONNECTED))
  {
    HTTPClient http;
    http.begin(endpoint);
    int httpCode = http.GET();
    if (httpCode > 0)
    { 
      String result = http.getString();
      DynamicJsonDocument doc(2048);
      DeserializationError error = deserializeJson(doc, result);
      if (!error)
      {
        String timeStr = doc["datetime"].as<String>();
        uint8_t i = timeStr.indexOf('T');
        timeStr = timeStr.substring(i + 1, i + 9);
        timeStr.replace(":", "");
        char buf [6];
        timeStr.toCharArray(buf, 6);
        setTime(buf);
        return true;
      }
    }
    http.end();
  }
  return false;
}

void Clock::setTime(char time [6])
{
  char hoursEntered [2] = { time[0], time[1] };
  char minutesEntered [2] = { time[2], time[3] };
  char secondsEntered [2] = { time[4], time[5] };
  uint8_t hours = atoi(hoursEntered);
  uint8_t minutes = atoi(minutesEntered);
  uint32_t seconds = atoi(secondsEntered);
  uint32_t hoursToMinutes = hours * 60;
  uint32_t totalMinutes = hoursToMinutes + minutes;
  seconds += totalMinutes * 60;
  currentTime.tv_sec = seconds;
  currentTime.tv_usec = 0;
  settimeofday(&currentTime, NULL);
  lcd->clear();
}

void Clock::setAlarm(char time [6])
{
  char hoursEntered [2] = { time[0], time[1] };
  char minutesEntered [2] = { time[2], time[3] };
  char secondsEntered [2] = { time[4], time[5] };
  uint8_t hours = atoi(hoursEntered);
  uint8_t minutes = atoi(minutesEntered);
  uint32_t seconds = atoi(secondsEntered);
  uint32_t hoursToMinutes = hours * 60;
  uint32_t totalMinutes = hoursToMinutes + minutes;
  seconds += totalMinutes * 60;
  alarmTime.tv_sec = seconds;
  alarmTime.tv_usec = 0;
  alarmSet = true;
  lcd->clear();
}