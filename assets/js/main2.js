const audioElement = document.getElementById('audio');
const bar = document.querySelector('.bar');
const mixer = document.querySelector('.mixer');
const currentTimeElement = document.getElementById('current-time');
const durationElement = document.getElementById('duration');
const timeListContainer = document.querySelector('.time-reproducer');


const audioUI = new AudioUI(audioElement, currentTimeElement, durationElement, timeListContainer);
const audioManager = new AudioManager(audioElement, bar, mixer,audioUI);

const fileHandler = new FileHandler(audioManager.audioContext);
console.log("exec...");


audioManager.attachListeners();
audioUI.updateTimeDisplay();
audioUI.generateTimeList();
