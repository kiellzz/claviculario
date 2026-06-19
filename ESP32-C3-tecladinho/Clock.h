#ifndef CLOCK_H
#define CLOCK_H

#include "Buzzer.h"
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>

class Clock
{
  public:
    int snooze;
    void silence();
    void updateClock();
    void addToSnooze();
    bool setTimeFromAPI();
    void setTime(char time [6]);
    void setAlarm(char time [6]);
    Clock(LiquidCrystal_I2C *display);

  private:
    void alarm();
    bool alarmSet;
    LiquidCrystal_I2C *lcd;
    struct timeval alarmTime;
    struct timeval currentTime;
    void printTime(uint8_t hours, uint8_t minutes, uint8_t seconds);
};

#endif