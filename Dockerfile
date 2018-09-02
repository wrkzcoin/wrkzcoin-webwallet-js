FROM microsoft/dotnet:2.1-aspnetcore-runtime-nanoserver-1709 AS base
WORKDIR /app
EXPOSE 52276
EXPOSE 44395

FROM microsoft/dotnet:2.1-sdk-nanoserver-1709 AS build
WORKDIR /src
COPY plenteum-webwallet.csproj ./
RUN dotnet restore /plenteum-webwallet.csproj
COPY . .
WORKDIR /src/
RUN dotnet build plenteum-webwallet.csproj -c Release -o /app

FROM build AS publish
RUN dotnet publish plenteum-webwallet.csproj -c Release -o /app

FROM base AS final
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "plenteum-webwallet.dll"]
