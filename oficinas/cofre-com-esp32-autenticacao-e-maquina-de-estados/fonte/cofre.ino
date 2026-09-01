#include <BluetoothSerial.h>              // Biblioteca para usar Bluetooth no ESP32.
#include <Wire.h>                         // Biblioteca para comunicação I2C.
#include <Adafruit_GFX.h>                 // Biblioteca gráfica usada pelo OLED.
#include <Adafruit_SSD1306.h>             // Biblioteca do display OLED SSD1306.
#include <ESP32Servo.h>                   // Biblioteca para controlar servo motor no ESP32.
#define CUSTOM_SETTINGS
#define INCLUDE_TERMINAL_MODULE
#include <Dabble.h>

#define ENDERECO_OLED 0x3C                // Define o endereço I2C do OLED.

#define OLED_SDA 22                 // Define o pino SDA do OLED como D22.
#define OLED_SCL 4                  // Define o pino SCK/SCL do OLED como D4.
#define VERMELHO 15                 // Define o pino do vermelho do LED RGB como D15.
#define VERDE 21                    // Define o pino do verde do LED RGB como D21.
#define AZUL 19                    // Define o pino do azul do LED RGB como D19.

#define BOTAO 18                     // Define o pino do botão como D18.
#define pino_servo 5                 //Define o pino do servo motor como D5.

Servo servo;                        //Cria o objeto servo motor dentro do código.
const String SENHA_CORRETA = "1234";      // Define a senha correta do cofre.

BluetoothSerial SerialBT;                 // Cria o objeto para comunicação Bluetooth.
Adafruit_SSD1306 display(128, 64, &Wire, -1); // Cria o objeto do OLED.

enum status {                             // cria o tipo de variável "estado", que só aceita os valores descritos.
  TRAVADO,                                // Estado inicial, aguardando senha.
  DIGITANDO,                              // Estado enquanto o usuário digita.
  LIBERADO,                               // Estado após senha correta.
  BLOQUEADO                               // Estado após três erros.
};

status estado = TRAVADO;                  // Define o estado inicial como travado.
String senhaDigitada = "";                // Guarda a senha recebida pelo Bluetooth.
int tentativas = 0;                       // Conta as tentativas erradas.
bool botaoAntes = false;                  // Guarda o estado anterior do botão.
unsigned long inicioBloqueio = 0;         // Guarda o tempo inicial do bloqueio.
unsigned long inicioLiberado = 0;         // Guarda o tempo inicial da liberação.

void setup() {                            // Função executada uma vez ao ligar.
  Serial.begin(115200);                   // Inicia a comunicação serial USB.
  Dabble.begin(9600);
  SerialBT.begin("Cofre_ESP32");          // Inicia o Bluetooth com o nome Cofre_ESP32.
  servo.attach(pino_servo);
  pinMode(BOTAO, INPUT_PULLDOWN);         // Configura o botão usando pull-down interno. Isso garante que a D18 não receba sinal caso o botão não seja pressionado.
  servo.write(0);                         // Cofre fechado.
  pinMode(VERMELHO, OUTPUT);
  pinMode(AZUL, OUTPUT);
  pinMode(VERDE, OUTPUT);                 //Define os pinos dos LEDs como saída.

  Wire.begin(OLED_SDA, OLED_SCL); // Inicia o I2C nos pinos escolhidos.

  if (!display.begin(SSD1306_SWITCHCAPVCC, ENDERECO_OLED)) { // Tenta iniciar o OLED.
    while (true);                          // Para o programa caso o OLED não funcione.
  }

  mostrar("Cofre ESP32", "Iniciando..."); // Mostra mensagem inicial.
  delay(1500);                            // Espera 1,5 segundo.
  estado = TRAVADO;                       // Define o estado como travado.
  senhaDigitada = "";                     // Limpa qualquer senha parcial.
  digitalWrite(VERDE, LOW);
  digitalWrite(AZUL, HIGH);  
  digitalWrite(VERMELHO, LOW);               // Acende o LED azul.
  mostrar("Aguardando", "senha BT");      // Coloca o cofre no estado inicial.
  servo.write(0);                         // Cofre fechado.
}

void loop() {                             // Função principal repetida continuamente.
  Dabble.process();
  verificarBotao();                       // Verifica se o botão foi pressionado.

  if (estado == BLOQUEADO) {              // Se o cofre está bloqueado.
    controlarBloqueio();                  // Chama a função que ontrola o bloqueio de 10s.
    return;                               // Encerra esta volta do loop.
  }

  if (estado != LIBERADO) {               // Se o cofre não está liberado.
    lerBluetooth();                       // Permite receber senha pelo Bluetooth.
  }

  if (estado == LIBERADO) {               // Se o cofre está liberado, chama a função mostrar para exibir a mensagem.
    mostrar("Cofre aberto", "Aperte botao para fechar");        
  }
}

void lerBluetooth() {                     // Função que lê dados do Bluetooth.
  while (Terminal.available()) {      // Enquanto houver dados recebidos.
    char c = Terminal.read();             // Lê um caractere recebido.

    if (c == '\n' || c == '\r') {          // Verifica se recebeu Enter.
      if (senhaDigitada.length() > 0) {   // Verifica se existe uma senha digitada.
        conferirSenha();                  // chama a função void conferirSenha, que vai comparar a senha digitada com a correta.
      }
    } else {                              // Se não for Enter, o usuário pode continuar digitando a senha.
      senhaDigitada += c;                 // Adiciona o caractere à senha.
      estado = DIGITANDO;                 // Muda para estado digitando.
      digitalWrite(VERDE, HIGH);
      digitalWrite(AZUL, HIGH);  
      digitalWrite(VERMELHO, LOW);        // Acende amarelo (verde + azul).
      mostrarDigitando();                 // Mostra asteriscos no OLED.
    }
  }
}

void conferirSenha() {                    // Função que compara a senha digitada.
  if (senhaDigitada == SENHA_CORRETA) {   // Verifica se a senha está correta.
    tentativas = 0;                       // Zera tentativas erradas.
    senhaDigitada = "";                   // Limpa a senha digitada.
    estado = LIBERADO;                     // Define o estado como liberado.
  inicioLiberado = millis();              // Registra o momento da liberação.
  digitalWrite(VERDE, HIGH);
  digitalWrite(AZUL, LOW);  
  digitalWrite(VERMELHO, LOW);             // Acende o LED verde.
  mostrar("Acesso", "liberado");          // Mostra mensagem de acesso liberado.
  SerialBT.println("Senha correta.");
  servo.write(90);                        //Cofre aberto.

  } 
  else {                                // Caso a senha esteja errada.
    tentativas++;                         // Soma uma tentativa errada.
    senhaDigitada = "";                   // Limpa a senha digitada.
    mostrar("Senha errada", "Tente de novo"); // Mostra mensagem de erro.
  digitalWrite(VERDE, LOW);
  digitalWrite(AZUL, LOW);  
  digitalWrite(VERMELHO, HIGH);  
                      

  if (tentativas >= 3) {                   // Verifica se chegou ao limite de erros.
    estado = BLOQUEADO;                     // Define o estado como bloqueado.
  inicioBloqueio = millis();              // Registra o início do bloqueio.
  digitalWrite(VERDE, LOW);
  digitalWrite(AZUL, LOW);  
  digitalWrite(VERMELHO, HIGH);                      // Acende vermelho fixo.
  mostrar("Bloqueado", "Aguarde 10s");    // Mostra mensagem de bloqueio.
  SerialBT.println("Bloqueado por 10s.");                    // Entra no estado bloqueado.
  } else {                                // Caso ainda restem tentativas.
    String texto = "Restam: ";            // Cria texto da segunda linha.
    texto += String(3 - tentativas);      // Calcula tentativas restantes.
    mostrar("Senha errada", texto);       // Mostra tentativas restantes.
    delay(1200);                          // Espera o usuário ler.
    estado = TRAVADO;                       // Define o estado como travado.
  senhaDigitada = "";                     // Limpa qualquer senha parcial.
  digitalWrite(VERDE, LOW);
  digitalWrite(AZUL, HIGH);  
  digitalWrite(VERMELHO, LOW);               // Acende o LED azul.
  mostrar("Aguardando", "senha BT");      // Mostra mensagem de espera.                    
  }                          
  }
}


void controlarBloqueio() {                // Função que controla o estado bloqueado.
  while (SerialBT.available() > 0) {      // Se receber algo durante bloqueio.
    SerialBT.read();                      // Descarta o caractere recebido.
  }

  int restante = 10 - ((millis() - inicioBloqueio) / 1000); // Calcula segundos restantes.

  if (restante < 0) {                     // Evita número negativo.
    restante = 0;                         // Corrige para zero.
  }

  String texto = "Aguarde ";              // Cria texto da segunda linha.
  texto += String(restante);              // Adiciona o número de segundos.
  texto += "s";                           // Adiciona a unidade de tempo.

  mostrar("Bloqueado", texto);            // Atualiza o OLED.
  digitalWrite(VERDE, LOW);
  digitalWrite(AZUL, LOW);  
  digitalWrite(VERMELHO, HIGH);             // Mantém vermelho ligado.

  if (millis() - inicioBloqueio >= 10000) { // Se terminou o tempo de bloqueio.
    tentativas = 0;                       // Zera tentativas.
    estado = TRAVADO;                       // Define o estado como travado.
  senhaDigitada = "";                     // Limpa qualquer senha parcial.
  digitalWrite(VERDE, LOW);
  digitalWrite(AZUL, HIGH);  
  digitalWrite(VERMELHO, LOW);               // Acende o LED azul.
  mostrar("Aguardando", "senha BT");         // Volta ao estado inicial.
  }
}

void verificarBotao() {                   // Função que verifica o botão.
  bool botaoAgora = digitalRead(BOTAO); // Lê o estado atual do botão.

  if (botaoAgora == HIGH && botaoAntes == false) { // Detecta quando o botão foi apertado.
    delay(50);                            // Aguarda para reduzir ruído mecânico.

    if (digitalRead(BOTAO) == HIGH) { // Confirma que o botão continua pressionado.
      if (estado == LIBERADO) {           // Só fecha o cofre se ele estiver liberado.
        estado = TRAVADO;                       // Define o estado como travado.
    senhaDigitada = "";                     // Limpa qualquer senha parcial.
    digitalWrite(VERDE, LOW);
    digitalWrite(AZUL, HIGH);  
    digitalWrite(VERMELHO, LOW);               // Acende o LED azul.
    servo.write(0);                           //Cofre fechado.
    mostrar("Aguardando", "senha BT");                  // Volta ao estado inicial.
        SerialBT.println("Cofre fechado."); // Avisa pelo Bluetooth.
      }
    }
  }

  botaoAntes = botaoAgora;                // Salva estado do botão para a próxima leitura.
}

void mostrar(String linha1, String linha2) { // Função que escreve duas linhas no OLED.
  display.clearDisplay();                 // Limpa a tela.
  display.setTextSize(1);                 // Define tamanho do texto.
  display.setTextColor(SSD1306_WHITE);    // Define cor branca.
  display.setCursor(0, 10);               // Posiciona a primeira linha.
  display.println(linha1);                // Escreve a primeira linha.
  display.setCursor(0, 30);               // Posiciona a segunda linha.
  display.println(linha2);                // Escreve a segunda linha.
  display.display();                      // Atualiza a tela.
}

void mostrarDigitando() {                 // Função que mostra a senha como asteriscos.
  display.clearDisplay();                 // Limpa a tela.
  display.setTextSize(1);                 // Define tamanho do texto.
  display.setTextColor(SSD1306_WHITE);    // Define cor branca.
  display.setCursor(0, 10);               // Posiciona o texto.
  display.println("Digitando...");        // Mostra mensagem de digitação.
  display.setCursor(0, 30);               // Posiciona a linha dos asteriscos.

  for (int i = 0; i < senhaDigitada.length(); i++) { // para cada caractere da senha, será exibido um asterisco.
    display.print("*");                   
  }

  display.display();                      // Atualiza a tela.
}
