## Sanity-Tests
### Framework
Für die Tests nutzen wir das [Karate Jar](https://github.com/karatelabs/karate/tree/master/karate-netty#standalone-jar).
Hinweise für den Aufbau der Requests findet Ihr hier: [Karate GitHub](https://github.com/karatelabs/karate)

### Aufbau
* .github/workflow.properties -> "KARATE_VERSION" muss gem. [Release-Seite](https://github.com/karatelabs/karate/releases) gesetzt sein. 
* sanityTests
  * target -> Ziel-Ordner der Report-Files
  * karate-config.js -> Config-File für CMD Parameter -> Feature Files
  * logback-test.xml -> Logging Config
  * SanityTest.feature -> Sanity Tests
  * test.bat / test.sh -> Lokaler Start der Tests

### Lokaler Test
Ein lokaler Test ist möglich, jedoch muss zuvor die "karate-(version).jar" von der [Release-Seite](https://github.com/karatelabs/karate/releases) 
heruntergeladen und in den sanityTests Ordner als "karate.jar" abgelegt werden.
Im Anschluss kann per test.bat oder test.sh getestet werden.

Sofern ein tieferes Debugging notwendig ist, so kann die "logback-test.xml" auf Debug gestellt werden:
```xml
<!--<logger name="com.intuit.karate" level="INFO"/>-->
<logger name="com.intuit.karate" level="DEBUG"/>
```

### Dynamische Parameter
Sollen neben baseUrl und dem Authorization-Header weitere Parameter beim Aufruf übergeben werden, so müssen diese wie 
folgt eingetragen werden:
* SanityTest.feature Zeile mit Variable erweitern:
```gherkin
  #"authorization" ist der Variablen Name
  And header Authorization = authorization 
```

* karate.config.js erweitern:
```js
    //"authorization" ist der interne Name der Variablen, "Authorization" der externe welcher per CMD übergeben wird
    authorization: karate.properties['Authorization']
```

* test.sh und test.bat anpassen. Hier ein Beispiel für die .bat:
```text
  :: "Authorization" ist der Variablen Name, welcher an karate.config.js übergeben wird
  -DAuthorization="Authorization: Basic dGVzdDp0ZXN0" ^
```