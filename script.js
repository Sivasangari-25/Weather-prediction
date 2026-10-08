const weatherSection = document.getElementById("weatherSection");
const loading = document.getElementById("loading");
const errorMessage = document.getElementById("error");

const weatherDescriptions = {
    0: ["Clear Sky", "☀️"],
    1: ["Mainly Clear", "🌤️"],
    2: ["Partly Cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Fog", "🌫️"],
    48: ["Depositing Rime Fog", "🌫️"],
    51: ["Light Drizzle", "🌦️"],
    53: ["Moderate Drizzle", "🌦️"],
    55: ["Dense Drizzle", "🌧️"],
    61: ["Slight Rain", "🌦️"],
    63: ["Moderate Rain", "🌧️"],
    65: ["Heavy Rain", "🌧️"],
    71: ["Slight Snow", "🌨️"],
    73: ["Moderate Snow", "🌨️"],
    75: ["Heavy Snow", "❄️"],
    80: ["Rain Showers", "🌦️"],
    81: ["Moderate Rain Showers", "🌧️"],
    82: ["Violent Rain Showers", "⛈️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm with Hail", "⛈️"],
    99: ["Heavy Thunderstorm with Hail", "⛈️"]
};


// Search weather by city
async function searchWeather() {

    const city = document.getElementById("cityInput").value.trim();

    if (city === "") {
        showError("Please enter a city name.");
        return;
    }

    hideError();
    showLoading();

    try {

        const geoURL =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const geoResponse = await fetch(geoURL);

        if (!geoResponse.ok) {
            throw new Error("Location service unavailable.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Please enter a valid city.");
        }

        const location = geoData.results[0];

        await fetchWeather(
            location.latitude,
            location.longitude,
            location.name,
            location.country
        );

    } catch (error) {

        showError(error.message);

    } finally {

        hideLoading();

    }
}


// Fetch weather
async function fetchWeather(latitude, longitude, city, country) {

    const weatherURL =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=auto`;

    const response = await fetch(weatherURL);

    if (!response.ok) {
        throw new Error("Unable to fetch weather data.");
    }

    const data = await response.json();

    displayCurrentWeather(data, city, country);

    displayForecast(data);

    weatherSection.style.display = "block";
}


// Display current weather
function displayCurrentWeather(data, city, country) {

    const current = data.current;

    const weatherCode = current.weather_code;

    const weatherInfo =
        weatherDescriptions[weatherCode] ||
        ["Unknown Weather", "🌤️"];

    document.getElementById("cityName").textContent =
        `${city}, ${country}`;

    document.getElementById("weatherDescription").textContent =
        weatherInfo[0];

    document.getElementById("weatherIcon").textContent =
        weatherInfo[1];

    document.getElementById("temperature").textContent =
        Math.round(current.temperature_2m);

    document.getElementById("feelsLike").textContent =
        Math.round(current.apparent_temperature);

    document.getElementById("humidity").textContent =
        current.relative_humidity_2m;

    document.getElementById("windSpeed").textContent =
        Math.round(current.wind_speed_10m);

    document.getElementById("rainChance").textContent =
        data.daily.precipitation_probability_max[0];
}


// Display 7 day forecast
function displayForecast(data) {

    const forecastContainer =
        document.getElementById("forecast");

    forecastContainer.innerHTML = "";

    const dates = data.daily.time;

    for (let i = 0; i < 7; i++) {

        const date = new Date(dates[i]);

        const dayName = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        const code = data.daily.weather_code[i];

        const weatherInfo =
            weatherDescriptions[code] ||
            ["Unknown", "🌤️"];

        const maxTemp =
            Math.round(data.daily.temperature_2m_max[i]);

        const minTemp =
            Math.round(data.daily.temperature_2m_min[i]);

        const rain =
            data.daily.precipitation_probability_max[i];

        const card = document.createElement("div");

        card.className = "forecast-card";

        card.innerHTML = `
            <div class="day">${dayName}</div>

            <div class="icon">
                ${weatherInfo[1]}
            </div>

            <div>
                ${weatherInfo[0]}
            </div>

            <div class="temp">
                ${maxTemp}° / ${minTemp}°
            </div>

            <div class="rain">
                🌧️ ${rain}% rain
            </div>
        `;

        forecastContainer.appendChild(card);
    }
}


// Get user's location
function getLocation() {

    if (!navigator.geolocation) {

        showError("Geolocation is not supported by your browser.");

        return;
    }

    showLoading();
    hideError();

    navigator.geolocation.getCurrentPosition(

        async function(position) {

            try {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;

                const reverseURL =
                    `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`;

                const reverseResponse =
                    await fetch(reverseURL);

                const locationData =
                    await reverseResponse.json();

                let city = "My Location";
                let country = "";

                if (
                    locationData.results &&
                    locationData.results.length > 0
                ) {

                    city =
                        locationData.results[0].name;

                    country =
                        locationData.results[0].country || "";
                }

                await fetchWeather(
                    latitude,
                    longitude,
                    city,
                    country
                );

            } catch (error) {

                showError(
                    "Unable to get weather for your location."
                );

            } finally {

                hideLoading();
            }
        },

        function() {

            hideLoading();

            showError(
                "Location permission was denied."
            );
        }
    );
}


// Loading
function showLoading() {
    loading.style.display = "block";
    weatherSection.style.display = "none";
}

function hideLoading() {
    loading.style.display = "none";
}


// Error
function showError(message) {

    errorMessage.textContent = message;

    errorMessage.style.display = "block";
}

function hideError() {

    errorMessage.style.display = "none";
}


// Load Chennai when page opens
window.addEventListener("load", () => {

    searchWeather();

});