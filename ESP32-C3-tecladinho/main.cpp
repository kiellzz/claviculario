#include <Keypad.h>
#include "Clock.h"
#include "Weather.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>

#define I2C_ADDR    0x27
#define LCD_COLUMNS 16
#define LCD_LINES   2

// Pinos dos LEDs e Buzzer
#define LED1_PIN 8
#define LED2_PIN 9
#define BUZZER_PIN 10

uint8_t state;
unsigned long clockTimer;
unsigned long weatherAPItimer;
unsigned long weatherDisplayTimer;

// Variáveis para controle do Timeout dos LEDs (30 segundos)
unsigned long led1Timer = 0;
unsigned long led2Timer = 0;
bool led1Ativo = false;
bool led2Ativo = false;
const unsigned long TIMEOUT_LED = 30000; // 30 segundos em milissegundos

// Variável simulada para o RFID (mude para true quando o RFID ler uma tag válida)
bool rfidDetectado = false; 

const char* password = "";
const char* ssid = "Wokwi-GUEST";

uint8_t valIndex;
uint8_t cursorPos;
char entered_value [6];

// Variáveis para o controle dos LEDs por digitação
char ledBuffer[3] = {0}; 
uint8_t ledBufferIndex = 0;

const uint8_t ROWS = 4;
const uint8_t COLS = 4;
char keys[ROWS][COLS] = {
  { '1', '2', '3', 'A' },
  { '4', '5', '6', 'B' },
  { '7', '8', '9', 'C' },
  { '*', '0', '#', 'D' }
};
uint8_t colPins[COLS] = { 1, 0, 3, 2 };
uint8_t rowPins[ROWS] = { 4, 5, 6, 7 };

LiquidCrystal_I2C lcd(I2C_ADDR, LCD_COLUMNS, LCD_LINES);
Clock rtc(&lcd);
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

void enterTime()
{
  state = 1;
  memset(&entered_value[0], 0, sizeof(entered_value));
  cursorPos = 0;
  valIndex = 0;
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Set clock then  ");
  lcd.setCursor(0, 1);
  lcd.print("press # to save.");
  delay(3000);
  lcd.clear();
}

void enterAlarm()
{
  state = 2;
  memset(&entered_value[0], 0, sizeof(entered_value));
  cursorPos = 0;
  valIndex = 0;
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Enter alarm time");
  lcd.setCursor(0, 1);
  lcd.print("press # to save.");
  delay(3000);
  lcd.clear();
}

void nextChar(char key)
{
  if (valIndex < 6)
  {
    entered_value[valIndex] = key;
    lcd.setCursor(0, 0);
    lcd.print(entered_value);
    cursorPos++;
    valIndex++;
  }
}

void eraseChar()
{
  if (valIndex > 0 )
  {
    valIndex--;
    cursorPos--;
    entered_value[valIndex] = '\0';
    lcd.setCursor(cursorPos, 0);
    lcd.print(' ');
    lcd.setCursor(cursorPos, 0);
  }
}

void keyPadState0()
{
  char key = keypad.getKey();
  if (!key) return;

  switch(key)
  {
    case 'A':
      enterAlarm();
      ledBufferIndex = 0;
      break;
    case 'C':
      enterTime();
      ledBufferIndex = 0;
      break;
    case '#':
      if (ledBufferIndex == 2)
      {
        String comando = String(ledBuffer);
        
        if (comando == "01")
        {
          if (led1Ativo) 
          {
            digitalWrite(LED1_PIN, LOW);
            led1Ativo = false;
            lcd.setCursor(0, 1);
            lcd.print("LED 1 APAGADO!  ");
            
            // SOM DE DESLIGAMENTO MANUAL (Dois bipes curtos)
            buzzerTone(BUZZER_PIN, 40, 1500);
            delay(50);
            buzzerTone(BUZZER_PIN, 40, 1500);
          } 
          else 
          {
            digitalWrite(LED1_PIN, HIGH);
            led1Timer = millis(); 
            led1Ativo = true;
            lcd.setCursor(0, 1);
            lcd.print("LED 1 LIGADO!   ");
            
            // SOM DE CONFIRMAÇÃO/LIGADO (Bip padrão)
            buzzerTone(BUZZER_PIN, 80, 1000);
          }
          delay(1500);
        }
        else if (comando == "02")
        {
          if (led2Ativo) 
          {
            digitalWrite(LED2_PIN, LOW);
            led2Ativo = false;
            lcd.setCursor(0, 1);
            lcd.print("LED 2 APAGADO!  ");
            
            // SOM DE DESLIGAMENTO MANUAL (Dois bipes curtos)
            buzzerTone(BUZZER_PIN, 40, 1500);
            delay(50);
            buzzerTone(BUZZER_PIN, 40, 1500);
          } 
          else 
          {
            digitalWrite(LED2_PIN, HIGH);
            led2Timer = millis(); 
            led2Ativo = true;
            lcd.setCursor(0, 1);
            lcd.print("LED 2 LIGADO!   ");
            
            // SOM DE CONFIRMAÇÃO/LIGADO (Bip padrão)
            buzzerTone(BUZZER_PIN, 80, 1000);
          }
          delay(1500);
        }
        else 
        {
          lcd.setCursor(0, 1);
          lcd.print("Cod Invalido!   ");
          // Bip de erro opcional (grave)
          buzzerTone(BUZZER_PIN, 200, 4000);
          delay(1500);
        }
      }
      else
      {
        rtc.silence();
      }
      ledBufferIndex = 0;
      break;
      
    case '*':
      rtc.addToSnooze();
      ledBufferIndex = 0;
      break;
      
    default:
      if (isDigit(key) && ledBufferIndex < 2)
      {
        ledBuffer[ledBufferIndex] = key;
        ledBufferIndex++;
        ledBuffer[ledBufferIndex] = '\0'; 

        lcd.setCursor(0, 1);
        lcd.print("LED: ");
        lcd.print(ledBuffer);
        lcd.print("   "); 
      }
      break;
  }
}

void keyPadState1()
{
  char key = keypad.getKey();
  switch(key)
  {
    case '#':
      rtc.setTime(entered_value);
      state = 0;
      break;
    case '*':
      eraseChar();
      break;
    default:
      if (isDigit(key))
      {
        nextChar(key);
      }
      break;
  }
}

void keyPadState2()
{
  char key = keypad.getKey();
  switch(key)
  {
    case '#':
      rtc.setAlarm(entered_value);
      state = 0;
      break;
    case '*':
      eraseChar();
      break;
    default:
      if (isDigit(key))
      {
        nextChar(key);
      }
      break;
  }
}

void getInput()
{
  switch (state)
  {
    case 0:
      keyPadState0();
      break;
    case 1:
      keyPadState1();
      break;
    case 2:
      keyPadState2();
      break;
  }
}

void setup() 
{
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT); // Usando a constante definida
  
  Wire.begin(18, 19);
  lcd.init();
  lcd.backlight();
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) 
  {
    lcd.print(".");
    delay(1000);
  }
  lcd.clear();
  if (!rtc.setTimeFromAPI())
  {
    char t [] = __TIME__;
    char compileTime [] = { t[0], t[1], t[3], t[4], t[6], t[7] };
    rtc.setTime(compileTime);
  }
  getWeather(lcd);
  printWeather(lcd);
}

void loop() 
{
  unsigned long millisNow = millis();

  if (state == 0)
  {
    if (millisNow - clockTimer >= 1000)
    {
      clockTimer = millisNow;
      rtc.updateClock();
    }
    if (millisNow - weatherDisplayTimer >= 10000)
    {
      weatherDisplayTimer = millisNow;
      printWeather(lcd);
    }
    if (millisNow - weatherAPItimer >= 3600000)
    {
      weatherAPItimer = millisNow;
      getWeather(lcd);
    }

    // Verificação de Timeout ou RFID para o LED 1
    if (led1Ativo)
    {
      if (millisNow - led1Timer >= TIMEOUT_LED || rfidDetectado)
      {
        digitalWrite(LED1_PIN, LOW);
        led1Ativo = false;
        lcd.setCursor(0, 1);
        lcd.print("LED 1 DESLIGADO ");
        
        // SOM DE TIMEOUT / DESLIGAMENTO AUTOMÁTICO (Bip longo e mais grave)
        buzzerTone(BUZZER_PIN, 150, 2500);
        delay(1000);
      }
    }

    // Verificação de Timeout ou RFID para o LED 2
    if (led2Ativo)
    {
      if (millisNow - led2Timer >= TIMEOUT_LED || rfidDetectado)
      {
        digitalWrite(LED2_PIN, LOW);
        led2Ativo = false;
        lcd.setCursor(0, 1);
        lcd.print("LED 2 DESLIGADO ");
        
        // SOM DE TIMEOUT / DESLIGAMENTO AUTOMÁTICO (Bip longo e mais grave)
        buzzerTone(BUZZER_PIN, 150, 2500);
        delay(1000);
      }
    }
  }
  getInput(); 
}