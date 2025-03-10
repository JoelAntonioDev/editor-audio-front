class AudioUI {
  constructor(
    audioElement,
    timeListContainer
  ) {
    this.audio = audioElement;
    this.timeListContainer = timeListContainer;
    this.fileNameElement = document.getElementById("fileName");
    this.fileFormatElement = document.getElementById("fileFormat");
    this.fileSizeElement = document.getElementById("fileSize");
    this.progressBar = document.getElementById("progressBar");
    this.progressText = document.getElementById("progressText");
    this.mostrarTempo = document.getElementById("mostrar-tempo");
    this.loadingModal = document.getElementById("loadingModal");
    this.isFirstAudioAdded = false;
    this.audioIdCounter = 0;
    this.audioId = 0;
    this.audioControllers = document.querySelector(".audio-controllers");
    this.audioControllers2 = document.querySelector(".audio-controllers-2");
    this.audioMixerStatus = document.querySelector(".audio-mixer-status");
  }

  updateTimeDisplay() {
    this.audio.addEventListener("timeupdate", () => {
      console.log("entrou...");
      const currentMinutes = Math.floor(this.audio.currentTime / 60);
      const currentSeconds = Math.floor(this.audio.currentTime % 60);
      const durationMinutes = Math.floor(this.audio.duration / 60);
      const durationSeconds = Math.floor(this.audio.duration % 60);
    });
  }

  generateTimeList() {
    this.audio.addEventListener("loadedmetadata", () => {
      const totalSeconds = Math.floor(this.audio.duration);
      const interval = totalSeconds > 1800 ? 900 : 30;

      const list = document.createElement("ul");
      list.classList.add("time-list");

      for (let i = 0; i < totalSeconds; i += interval) {
        const li = document.createElement("li");
        li.textContent = `${Math.floor(i / 60)}:${(i % 60)
          .toString()
          .padStart(2, "0")}`;
        list.appendChild(li);
      }

      this.timeListContainer.appendChild(list);
    });
  }

  showLoadingModal(file) {
    loadingModal.style.display = "flex";
    this.fileNameElement.textContent = file.name || "N/A";
    this.fileFormatElement.textContent = file.type || "Desconhecido";
    this.fileSizeElement.textContent = this.formatFileSize(file.size);

    this.actualizarProgresso(0);
  }

  hideLoadingModal() {
    loadingModal.style.display = "none";
  }

  actualizarProgresso(percent) {
    this.progressBar.style.width = `${percent}%`;
    this.progressText.textContent = `${percent}%`;
  }

  createSoundTimeController(audioURL, fileName, audioBuffer, audioId) {
    const audioViewer = document.querySelector(".audio-viewer");

    const existingAudioContainer = document.getElementById(
      `audio-container-${audioId}`
    );
    const existingAudioControl = document.getElementById(
      `audio-controls-${audioId}`
    );

    if (existingAudioContainer) {
      existingAudioContainer.remove();
    }
    if (existingAudioControl) {
      existingAudioControl.remove();
    }

    // Cria um novo contêiner para o áudio
    const audioContainer = document.createElement("div");
    audioContainer.classList.add("audio-container");
    audioContainer.id = `audio-container-${this.audioId++}`; // Adiciona um ID único
    audioContainer.style.cssText =
      "display: flex; flex-direction: column; margin-bottom: 20px; width: 100%";

    const titleDiv = document.createElement("div");
    titleDiv.style.cssText =
      "display: flex; flex-direction: row; gap: 25px; align-items: center; color: black";
    const fileNameSpan = document.createElement("span");
    fileNameSpan.style.cssText = `color:#ccc;font-size:10pt;`;
    fileNameSpan.textContent = fileName;
    titleDiv.appendChild(fileNameSpan);
    audioContainer.appendChild(titleDiv);

    const soundTimeController = document.createElement("div");
    soundTimeController.classList.add("sound-time-controler");

    const mixer = document.createElement("div");
    mixer.classList.add("mixer");
    mixer.style.cssText =
      "height: 55px; width: 100%; position: relative; background-color: #dbdada;";

    const bar = document.createElement("div");
    bar.classList.add("bar");
    bar.style.cssText =
      "position: absolute; top: 0; bottom: 0; width: 4px; background-color: white; left: 0; cursor: pointer;";
    mixer.appendChild(bar);

    soundTimeController.appendChild(mixer);
    audioContainer.appendChild(soundTimeController);

    const audioElement = document.createElement("audio");
    audioElement.src = audioURL;
    audioElement.style.display = "none";
    audioContainer.appendChild(audioElement);

    const timeReproducer = document.createElement("div");
    timeReproducer.classList.add("time-reproducer");
    timeReproducer.style.cssText =
      "display: flex; flex-direction: row; width: 100%; height: 20px; background-color: grey;";
    soundTimeController.appendChild(timeReproducer);

    this.setupAudioControls(audioElement, bar, mixer, timeReproducer);

    audioElement.addEventListener("loadedmetadata", () => {
      let lista = document.createElement("ul");
      const totalSeconds = Math.floor(audioElement.duration);
      let interval = 30;

      if (totalSeconds > 1800) {
        interval = 900;
      }

      for (let i = 0; i < totalSeconds; i += interval) {
        let li = document.createElement("li");
        li.innerText = `${Math.floor(i / 60)}:${i % 60 < 10 ? "0" : ""}${i % 60
          }`;
        lista.appendChild(li);
      }
      const durationMinutes = Math.floor(audioElement.duration / 60);
      const durationSeconds = Math.floor(audioElement.duration % 60);
      let li = document.createElement("li");
      li.innerText = `${durationMinutes}:${durationSeconds < 10 ? "0" : ""
        }${durationSeconds}`;
      lista.appendChild(li);

      timeReproducer.appendChild(lista);
      lista.classList.add("time-list");
    });

    const audioControlsDiv = document.createElement("div");
    audioControlsDiv.id = `audio-controls-${this.audioIdCounter}`;
    const audioControlsDivLeft = document.createElement("div");
    const audioControlsDivRight = document.createElement("div");
    audioControlsDivLeft.innerText = `${this.audioIdCounter + 1}`;
    audioControlsDivLeft.style.cssText = `
            width:10%;
            background-color:#818989;
            display:flex;
            justify-content:center;
            align-items:center;
            border-right:1px solid black;
        `;

    audioControlsDivRight.style.cssText = `
            width:90%;
            background-color:#818989;
            display:flex;
            flex-direction:column;
            padding:5px;
        `;

    const audioControlsDivRightTop = document.createElement("div");
    const audioControlsDivRightBottom = document.createElement("div");
    const audioTitle = document.createElement("h4");
    console.log();
    audioTitle.innerText = fileName;
    // Estilização para truncar o texto
    audioTitle.style.width = "20ch";
    audioTitle.style.whiteSpace = "nowrap";
    audioTitle.style.overflow = "hidden";
    audioTitle.style.textOverflow = "ellipsis";
    audioControlsDivRightTop.style.width = "20ch";
    audioControlsDivRightTop.style.display = "flex";
    audioControlsDivRightTop.appendChild(audioTitle);

    const trashButton = document.createElement("button");
    trashButton.innerHTML = "<i class='fa-solid fa-trash'></i>";
    trashButton.setAttribute("data-title", fileName);
    trashButton.addEventListener("click", ()=> {
      const audioTitle = fileName;
      console.log("Excluir áudio:", audioTitle);

      // Chamar a função de exclusão passando o título do áudio

      this.excluirAudio(audioTitle);
    });

    audioControlsDivRightTop.appendChild(trashButton);

    audioControlsDiv.appendChild(audioControlsDivLeft);
    audioControlsDiv.appendChild(audioControlsDivRight);
    audioControlsDivRight.appendChild(audioControlsDivRightTop);
    audioControlsDivRight.appendChild(audioControlsDivRightBottom);
    audioControlsDiv.style.cssText = `
            display:flex;
            flex-direction:row;
        `;

    audioControlsDiv.classList.add("audio-controls");

    const playPauseButton = document.createElement("button");
    playPauseButton.textContent = "Play";
    playPauseButton.id = `play-button-${this.audioIdCounter++}`;

    playPauseButton.addEventListener("click", () => {
      const allAudioElements = document.querySelectorAll("audio");
      let audioNumber = 0;
      if (audioElement.paused) {
        allAudioElements.forEach((audio) => {
          if (!audio.paused) {
            audio.pause();
            const pausedButton = document.querySelector(
              `button[id="play-button-${Array.from(allAudioElements).indexOf(
                audio
              )}"]`
            );
            if (pausedButton) {
              pausedButton.textContent = "Play";
            }
          }
        });
        audioNumber = Array.from(allAudioElements).indexOf(audioElement);
        audioElement.play();
        playPauseButton.textContent = "Pause";
        this.audioMixerStatus.textContent = `[ TOCANDO Audio - ${audioNumber} ]`;
      } else {
        audioNumber = Array.from(allAudioElements).indexOf(audioElement);
        audioElement.pause();
        playPauseButton.textContent = "Play";
        this.audioMixerStatus.innerText = `[ PAUSADO Audio - ${audioNumber} ]`;
      }
    });


    audioControlsDivRightBottom.appendChild(playPauseButton);

    const volumeControl = document.createElement("input");
    volumeControl.type = "range";
    volumeControl.min = 0;
    volumeControl.max = 1;
    volumeControl.step = 0.01;
    volumeControl.value = audioElement.volume;
    volumeControl.id = `volume-control-${this.audioIdCounter - 1}`;
    volumeControl.addEventListener("input", (e) => {
      audioElement.volume = e.target.value;
    });

    audioControlsDivRightBottom.appendChild(volumeControl);


    audioViewer.appendChild(audioContainer);

    //posicao dos controllers
    this.posicionarTracks(
      audioContainer,
      this.audioIdCounter,
      audioControlsDiv
    );

    this.audioControllers.appendChild(audioControlsDiv);
  }

  async excluirAudio(fileName) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get("project_id"); // Obtém o ID do projeto atual
      const token = localStorage.getItem("token") || getCookie("token"); // Recupera o token do usuário

      if (!token) {
        alert("Usuário não autenticado!");
        window.location.href = "./../index.html";
        return;
      }

      const response = await fetch("http://localhost:8000/api/audio/excluir", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          project_id: projectId,
          file_name: fileName
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert("Áudio excluído com sucesso!");
        // Atualizar a interface removendo o elemento do áudio
        this.removerAudioDaUI(fileName);
        window.location.reload();
      } else {
        alert("Erro ao excluir áudio: " + result.message);
      }
    } catch (error) {
      console.error("Erro ao excluir o áudio:", error);
      alert("Erro ao conectar ao servidor.");
    }
  }

  removerAudioDaUI(fileName) {
    const audioElements = document.querySelectorAll(".audio-item"); // Seleciona todos os elementos de áudio
    audioElements.forEach((audioElement) => {
      const titleElement = audioElement.querySelector("h4"); // Obtém o título do áudio
      if (titleElement && titleElement.innerText === fileName) {
        audioElement.remove(); // Remove o elemento correspondente
      }
    });
  }

  setupAudioControls(audio, bar, mixer, timeReproducer) {
    let isMoving = false;
    let offsetX = 0;

    bar.addEventListener("mousedown", (event) => {
      isMoving = true;
      offsetX = event.clientX - bar.getBoundingClientRect().left;
      bar.style.backgroundColor = "black";
    });

    document.addEventListener("mousemove", (event) => {
      if (isMoving) {
        let newX = event.clientX - offsetX;
        const mixerRect = mixer.getBoundingClientRect();
        const maxRight = mixerRect.width - bar.offsetWidth;

        newX = Math.max(0, Math.min(newX, maxRight));
        bar.style.left = `${newX}px`;

        const progress = (newX / mixerRect.width) * audio.duration;
        audio.currentTime = progress;

        // Atualiza a barra de tempo
        this.updateTimeDisplay(audio, timeReproducer);
      }
    });

    document.addEventListener("mouseup", () => {
      isMoving = false;
    });

    audio.addEventListener("timeupdate", () => {
      if (!isMoving) {
        const progress =
          (audio.currentTime / audio.duration) * mixer.offsetWidth;
        bar.style.left = `${progress}px`;

        // Atualiza a barra de tempo
        this.updateTimeDisplay(audio, timeReproducer);
      }
      const currentMinutes = Math.floor(audio.currentTime / 60);
      const currentSeconds = Math.floor(audio.currentTime % 60);
      const durationMinutes = Math.floor(audio.duration / 60);
      const durationSeconds = Math.floor(audio.duration % 60);
      this.mostrarTempo.textContent = `${currentMinutes}:${currentSeconds
        .toString()
        .padStart(2, "0")}`;
    });
  }

  formatFileSize(size) {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  posicionarTracks(audioContainer, audioCounter, audioControlsDiv) {
    let topPosition;

    if (this.audioControllers2) {
      let posicaoInfo = this.audioControllers2.getBoundingClientRect(); // Posição do .audio-controllers
      console.log("Top:", posicaoInfo.top);
      console.log("Left:", posicaoInfo.left);
      console.log("Width:", posicaoInfo.width);
      console.log("Height:", posicaoInfo.height);
      console.log("Bottom:", posicaoInfo.bottom);
      console.log("Right:", posicaoInfo.right);

      if (audioCounter === 1) {
        // Para o primeiro áudio, usar a posição de audioControllers2
        topPosition = posicaoInfo.bottom - 20;
      } else {
        // Para os demais áudios, pegar a posição do áudio anterior
        const previousAudio =
          document.querySelectorAll(".audio-container")[audioCounter - 2]; // Pega o áudio anterior
        const previousAudioRect = previousAudio.getBoundingClientRect(); // Posição do áudio anterior
        topPosition = previousAudioRect.bottom; // Coloca 10px abaixo do áudio anterior
      }

      if (audioContainer) {
        // Garantir que o áudio-container está com position correto
        audioContainer.style.position = "absolute";
        audioControlsDiv.style.position = "absolute";
        audioContainer.style.top = `${topPosition}px`; // Define a posição do topo
        audioControlsDiv.style.top = `${topPosition}px`;
        const containerHeight = audioContainer.getBoundingClientRect().height;
        audioControlsDiv.style.height = `${containerHeight}px`;
        console.log(
          `Novo top do .audio-container: ${audioContainer.style.top}`
        );
        console.log(
          `Novo height do .audio-controlsDiv: ${audioControlsDiv.style.height}`
        );
      } else {
        console.error("Elemento '.audio-container' não encontrado.");
      }
    } else {
      console.error("Elemento '.audio-controllers' não encontrado.");
    }
  }

}
