document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
            datasets: [{
                label: 'Precipitação (%)',
                data: [5, 7, 5, 20, 25, 20, 27],
                borderColor: '#63b3ed',
                backgroundColor: 'rgba(99, 179, 237, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false }, tooltip: { enabled: true } },
            animation: { duration: 2000 }
        }
    });

    const toggleBtn = document.getElementById('theme-toggle');
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        document.body.classList.toggle('dark-mode');
        toggleBtn.innerHTML = document.body.classList.contains('dark-mode') 
            ? '<i class="fas fa-moon"></i>' 
            : '<i class="fas fa-sun"></i>';
    });

    // Configuração do Firebase (suas chaves)
    firebase.initializeApp({
        apiKey: "xMjsSsHFhj1A7kPkcxUcRRhqbPlTS1nXaIJyUd6r",
        authDomain: "nimbus-ec47d.firebaseapp.com",
        databaseURL: "https://nimbus-ec47d-default-rtdb.firebaseio.com",
        projectId: "nimbus-ec47d",
        storageBucket: "nimbus-ec47d.appspot.com",
        messagingSenderId: "seu-sender-id", // Substitua se necessário
        appId: "seu-app-id" // Substitua se necessário
    });
    const database = firebase.database();

    function updateFromESP32() {
        database.ref('sensores').once('value').then(snapshot => {
            const data = snapshot.val();
            if (data) {
                document.getElementById('temp').textContent = `${Math.round(data.temp)}°C`;
                document.getElementById('humidity').textContent = `${data.humidity}%`;
                document.getElementById('pressure').textContent = `${data.pressure} hPa`;
            } else {
                console.log('Sem dados do ESP32');
            }
        }).catch(err => console.error('Erro ao ler Firebase:', err));
    }

    setInterval(updateFromESP32, 300000); // Atualiza a cada 5 minutos
    updateFromESP32();

    const apiKey = 'ca50095dd2e55f8a7fff4b1c5db19763'; // Sua chave OpenWeatherMap
    const searchBtn = document.getElementById('search-btn');
    searchBtn.addEventListener('click', () => {
        const city = document.getElementById('city-input').value || 'Maputo';
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}&lang=pt`)
            .then(response => {
                if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
                return response.json();
            })
            .then(data => {
                document.getElementById('location').textContent = `Localização: ${data.name}, ${data.sys.country}`;
                const icon = document.querySelector('.icon i');
                const weather = data.weather[0].main.toLowerCase();
                if (weather.includes('cloud')) icon.className = 'fas fa-cloud-moon';
                else if (weather.includes('rain')) icon.className = 'fas fa-cloud-rain';
                else icon.className = 'fas fa-sun';
                document.getElementById('wind').textContent = `${data.wind.speed} km/h`;
            })
            .catch(error => alert('Erro ao carregar dados: ' + error.message));
    });

    const openAlertsBtn = document.getElementById('open-alerts');
    openAlertsBtn.addEventListener('click', () => {
        const alertsWindow = window.open('alerts.html', 'AlertasClimaticos', 'width=400,height=500');
        if (!alertsWindow) alert('Permita pop-ups para ver os alertas.');
    });
});