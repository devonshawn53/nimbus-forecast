document.addEventListener('DOMContentLoaded', () => {
    const alertsList = document.getElementById('alerts-list');
    const closeAlertsBtn = document.getElementById('close-alerts');

    // Configuração do Firebase (suas chaves)
    firebase.initializeApp({
        apiKey: "xMjsSsHFhj1A7kPkcxUcRRhqbPlTS1nXaIJyUd6r",
        authDomain: "nimbus-ec47d.firebaseapp.com",
        databaseURL: "https://nimbus-ec47d-default-rtdb.firebaseio.com",
        projectId: "nimbus-ec47d",
        storageBucket: "nimbus-ec47d.appspot.com",
        messagingSenderId: "seu-sender-id", // Pegue no Firebase Console
        appId: "seu-app-id" // Pegue no Firebase Console
    });
    const database = firebase.database();

    function loadAlerts() {
        database.ref('sensores').once('value').then(snapshot => {
            const data = snapshot.val();
            alertsList.innerHTML = ''; // Limpar lista
            if (data) {
                if (data.temp > 30) {
                    alertsList.innerHTML += '<div class="p-2 rounded bg-red-500">Alerta: Temperatura acima de 30°C!</div>';
                }
                if (data.humidity < 30) {
                    alertsList.innerHTML += '<div class="p-2 rounded bg-blue-500">Alerta: Umidade baixa!</div>';
                }
                if (data.pressure < 1000) {
                    alertsList.innerHTML += '<div class="p-2 rounded bg-yellow-500">Alerta: Pressão baixa!</div>';
                }
                if (!alertsList.innerHTML) {
                    alertsList.innerHTML = '<div class="p-2 rounded bg-green-500">Nenhum alerta ativo.</div>';
                }
            } else {
                alertsList.innerHTML = '<div class="p-2 rounded bg-gray-500">Sem dados do ESP32.</div>';
            }
        }).catch(err => console.error('Erro ao ler Firebase:', err));
    }

    loadAlerts();
    setInterval(loadAlerts, 300000); // Atualiza a cada 5 minutos

    closeAlertsBtn.addEventListener('click', () => {
        window.close();
    });
});