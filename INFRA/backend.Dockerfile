# Build context = raiz do repositório (ver docker-compose.yml: context: ..)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY BACKEND/ .
COPY DATABASE/seed/seed-data.json /seed/seed-data.json
RUN dotnet publish src/Asteca.Api -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
COPY --from=build /seed/seed-data.json .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Asteca.Api.dll"]
