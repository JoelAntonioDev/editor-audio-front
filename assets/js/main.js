document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado!");

    const audioElement = document.getElementById('audio');
    const bar = document.querySelector('.bar');
    const mixer = document.querySelector('.mixer');

    const timeListContainer = document.querySelector('.time-reproducer');

    console.log("Verificando elementos:", { audioElement });

    const audioUI = new AudioUI(audioElement, timeListContainer);
    const audioManager = new AudioManager(audioElement, bar, mixer, audioUI);

    console.log("Execução iniciada...");
    audioManager.attachListeners();
    audioUI.updateTimeDisplay();
    audioUI.generateTimeList();
});
