# ---- Etapa 1: Build ----
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copia apenas arquivos de configuração primeiro (melhora cache)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copia o código-fonte e builda o jar
COPY src ./src
RUN mvn clean package -DskipTests

# ---- Etapa 2: Runtime ----
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

# Copia o jar gerado da etapa anterior
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Comando de inicialização
ENTRYPOINT ["java", "-jar", "app.jar"]
