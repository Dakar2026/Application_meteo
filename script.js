// ========================================
// 1. RÉCUPÉRER LES ÉLÉMENTS HTML
// ========================================

const weatherForm = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");

const statusMessage = document.getElementById("status-message");
const weatherCard = document.getElementById("weather-card");

const cityName = document.getElementById("city-name");
const weatherDescription = document.getElementById("weather-description");
const weatherIcon = document.getElementById("weather-icon");
const temperature = document.getElementById("temperature");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const forecastSection = document.getElementById("forecast-section");
const forecastContainer = document.getElementById("forecast-container");


// ========================================
// 2. AFFICHER UN MESSAGE
// ========================================

function showMessage(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = type;
}


// ========================================
// 3. CHOISIR L'ICÔNE ET LA DESCRIPTION
// ========================================

function getWeatherInfo(code, isDay) {
    if (code === 0) {
        return {
            description: "Ciel dégagé",
            icon: isDay ? "☀️" : "🌙"
        };
    }

    if (code === 1) {
        return {
            description: "Principalement dégagé",
            icon: isDay ? "🌤️" : "🌙"
        };
    }

    if (code === 2) {
        return {
            description: "Partiellement nuageux",
            icon: "⛅"
        };
    }

    if (code === 3) {
        return {
            description: "Ciel couvert",
            icon: "☁️"
        };
    }

    if ([45, 48].includes(code)) {
        return {
            description: "Brouillard",
            icon: "🌫️"
        };
    }

    if ([51, 53, 55, 56, 57].includes(code)) {
        return {
            description: "Bruine",
            icon: "🌦️"
        };
    }

    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return {
            description: "Pluie",
            icon: "🌧️"
        };
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return {
            description: "Neige",
            icon: "❄️"
        };
    }

    if ([95, 96, 99].includes(code)) {
        return {
            description: "Orage",
            icon: "⛈️"
        };
    }

    return {
        description: "Conditions variables",
        icon: "🌍"
    };
}


// ========================================
// 4. RECHERCHER LES COORDONNÉES D'UNE VILLE
// ========================================

async function getCityCoordinates(city) {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");

    url.search = new URLSearchParams({
        name: city,
        count: "1",
        language: "fr",
        format: "json"
    });

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Impossible de contacter le service de recherche.");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("Ville introuvable. Vérifie le nom et réessaie.");
    }

    return data.results[0];
}


// ========================================
// 5. RÉCUPÉRER LA MÉTÉO
// ========================================

async function getWeather(latitude, longitude) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");

    url.search = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
        timezone: "auto"
    });

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Impossible de récupérer les données météo.");
    }

    const data = await response.json();

    if (!data.current) {
        throw new Error("Les données météo sont indisponibles.");
    }

    return data;
}
async function getForecast(latitude, longitude) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");

    url.search = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        daily: "weather_code,temperature_2m_max,temperature_2m_min",
        timezone: "auto",
        forecast_days: "5"
    });

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Impossible de récupérer les prévisions.");
    }

    const data = await response.json();

    if (!data.daily) {
        throw new Error("Les prévisions sont indisponibles.");
    }

    return data.daily;
}
function displayForecast(daily) {
    forecastContainer.innerHTML = "";

    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i] + "T12:00:00");

        const dayName = date.toLocaleDateString("fr-FR", {
            weekday: "short"
        });

        const info = getWeatherInfo(daily.weather_code[i], true);

        const dayCard = document.createElement("div");
        dayCard.className = "forecast-day";

        const dayLabel = document.createElement("p");
        dayLabel.textContent =
            dayName.charAt(0).toUpperCase() + dayName.slice(1);

        const icon = document.createElement("span");
        icon.className = "forecast-icon";
        icon.textContent = info.icon;

        const temperatures = document.createElement("strong");
        temperatures.textContent =
            `${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°`;

        const description = document.createElement("p");
        description.className = "forecast-description";
        description.textContent = info.description;

        dayCard.append(dayLabel, icon, temperatures, description);
        forecastContainer.appendChild(dayCard);
    }

    forecastSection.classList.remove("hidden");
}


// ========================================
// 6. AFFICHER LA MÉTÉO
// ========================================

function displayWeather(city, weatherData) {
    const current = weatherData.current;

    const info = getWeatherInfo(
        current.weather_code,
        current.is_day === 1
    );

   cityName.textContent = `${city.name}, ${city.country}`;
temperature.textContent = Math.round(current.temperature_2m);
weatherDescription.textContent = info.description;
weatherIcon.textContent = info.icon;

humidity.textContent = `${current.relative_humidity_2m} %`;
windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    
    weatherCard.classList.remove("hidden");

    showMessage("Météo mise à jour avec succès !", "success");
}


// ========================================
// 7. GÉRER LA RECHERCHE
// ========================================

weatherForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (city.length < 2) {
        showMessage("Entre un nom de ville valide.", "error");
        cityInput.focus();
        return;
    }

    searchButton.disabled = true;
    searchButton.textContent = "Chargement...";
    weatherCard.classList.add("hidden");

    showMessage("Recherche de la météo en cours...");

    try {
       
       
        const cityData = await getCityCoordinates(city);

        const weatherData = await getWeather(
            cityData.latitude,
            cityData.longitude
        );

        const forecastData = await getForecast(
            cityData.latitude,
            cityData.longitude
        );

        displayWeather(cityData, weatherData);
        displayForecast(forecastData);

    } catch (error) {
        console.error("Erreur météo :", error);

        if (error instanceof TypeError) {
            showMessage(
                "Connexion impossible. Vérifie ta connexion Internet et réessaie.",
                "error"
            );
        } else {
            showMessage(error.message, "error");
        }

    } finally {
        searchButton.disabled = false;
        searchButton.textContent = "Rechercher";
    }
});


// ========================================
// 8. MESSAGE DE BIENVENUE
// ========================================

showMessage("Recherche une ville pour découvrir sa météo.");